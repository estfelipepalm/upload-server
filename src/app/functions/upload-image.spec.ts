import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest' // beforeAll removido por simplicidade
import { uploadImage } from './upload-image'
import { isLeft, isRight, unwrapEither } from '@/shared/either'
import { schema } from '@/infra/db/schemas'
import { db } from '@/infra/db'
import { eq } from 'drizzle-orm'
import { InvalidFileFormat } from './errors/invalid-file-format'

vi.mock('@/infra/storage/upload-file-to-storage', () => {
  return {
    uploadFileToStorage: vi.fn().mockImplementation(async () => {
      // Mockando como async, pois uploads geralmente são promessas
      return {
        key: `${randomUUID()}.jpg`,
        url: 'http://storage.com/image.jpg',
      }
    }),
  }
})

describe('upload image', () => {
  it('should be able to upload an image', async () => {
    const fileName = `${randomUUID()}.jpg`

    const sut = await uploadImage({
      fileName,
      contentType: 'image/jpeg',
      contentStream: Readable.from(['fake-image-data']),
    })

    expect(isRight(sut)).toBe(true)

    const result = await db
      .select()
      .from(schema.uploads)
      .where(eq(schema.uploads.name, fileName))

    expect(result).toHaveLength(1)
  })
  it('should not be able to upload an invalid file', async () => {
    const fileName = `${randomUUID()}.pdf`

    const sut = await uploadImage({
      fileName,
      contentType: 'image/pdf',
      contentStream: Readable.from(['fake-file-data']),
    })

    //Aqui, expect(...).toBe(...) é a sua asserção. Você está dizendo: "Eu espero que o resultado dessa função seja um sucesso (Right)".
    expect(isLeft(sut)).toBe(true)
    expect(unwrapEither(sut)).toBeInstanceOf(InvalidFileFormat)
  })
})
