import { fastifyCors } from '@fastify/cors'
import { fastify } from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { env } from '@/env'
import { uploadImageRoute } from './routes/upload-image'
import fastifyMultipart from '@fastify/multipart'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { transformSwaggerSchema } from './transform-swagger-schema'
import { getUploadsRoute } from './routes/get-uploads'
import { exportUploadsRoute } from './routes/export-uploads'

const server = fastify()

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.setErrorHandler((error, request, reply) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      message: 'Validation Error',
      issue: error.validation,
    })
  }
  //envia erro pra alguma ferramenta de observabilidade (sentry/datadog,grafana.OTel)

  console.error(error)

  return reply.status(500).send({
    message: 'Internal Server Error.',
  })
})

server.register(fastifyCors, { origin: '*' })

server.register(fastifyMultipart)
server.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Upload Server',
      version: '1.0.0',
    },
  },
  transform: transformSwaggerSchema,
})
server.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})
server.register(uploadImageRoute)
server.register(getUploadsRoute)
server.register(exportUploadsRoute)

console.log(env.DATABASE_URL)

server.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('htttp server running')
})
