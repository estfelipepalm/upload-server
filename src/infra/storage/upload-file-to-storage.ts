import { randomUUID } from 'node:crypto'
import { basename, extname } from 'node:path'
import { Readable } from 'node:stream'
import { Upload } from '@aws-sdk/lib-storage'
import { z } from 'zod'
import { r2 } from './client'
import { env } from '@/env'

const uploadFileToStorageInput = z.object({
  folder: z.enum(['images', 'downloads']),
  fileName: z.string(),
  contentType: z.string(),
  contentStream: z.instanceof(Readable),
})

type UploadFileToStorageInput = z.input<typeof uploadFileToStorageInput>

export async function uploadFileToStorage(input: UploadFileToStorageInput) {
  const { folder, fileName, contentType, contentStream } =
    uploadFileToStorageInput.parse(input)

  const fileExtension = extname(fileName)
  const fileNameWithoutExtension = basename(fileName)

  const sanitizedfileName = fileNameWithoutExtension.replace(
    /[^a-zA-Z0-9]/g,
    ''
  )
  const sanitizedfileNameWithoutExtension =
    sanitizedfileName.concat(fileExtension)

  const uniquefileName = `${folder}/${randomUUID()}-${sanitizedfileNameWithoutExtension}`

  const upload = new Upload({
    client: r2,
    params: {
      Key: uniquefileName,
      Bucket: env.CLOUDFLARE_BUCKET,
      Body: contentStream,
      ContentType: contentType,
    },
  })

  await upload.done()

  return {
    key: uniquefileName,
    url: new URL(uniquefileName, env.CLOUDFLARE_PUBLIC_URL).toString(),
  }
}
