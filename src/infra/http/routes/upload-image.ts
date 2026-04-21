import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { uploadImage } from '@/app/functions/upload-image'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { isRight, unwrapEither } from '@/shared/either'

export const uploadImageRoute: FastifyPluginAsyncZod = async server => {
  server.post(
    '/uploads',
    {
      schema: {
        summary: 'Upload an Image',
        tags: ['uploads'],
        consumes: ['multipart/form-data'],
        response: {
          201: z.void().describe('Image Uploaded'),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const uploadedFile = await request.file({
        limits: {
          //tamanho máximo de padaçøs que uma imagem pode ser enviada ao serviço de armazenamento do cloudflare R2
          fileSize: 1024 * 1024 * 2,
        },
      })

      if (!uploadedFile) {
        return reply.status(400).send({ message: 'File is required.' })
      }

      const result = await uploadImage({
        fileName: uploadedFile.filename,
        contentType: uploadedFile.mimetype,
        contentStream: uploadedFile.file,
      })

      // Verifica se o upload foi interrompido por atingir o limite máximo de tamanho definido (fileSize)
      if (uploadedFile.file.truncated) {
        return reply.status(400).send({ message: 'File size limited reached.' })
      }

      if (isRight(result)) {
        console.log(unwrapEither(result))
        return reply.status(201).send()
      }

      const error = unwrapEither(result)

      switch (error.constructor.name) {
        case 'InvalidFileFormat':
          return reply.status(400).send({ message: error.message })
      }
    }
  )
}
