import { jsonSchemaTransform } from 'fastify-type-provider-zod'

/**
 * TIPAGEM REATIVA: Utilizamos o Utility Type 'Parameters' para extrair os tipos
 * diretamente da função original da biblioteca. Isso garante que, se a lib
 * for atualizada, nosso código se adapta automaticamente às novas definições.
 */
type TransformSwaggerSchemaData = Parameters<typeof jsonSchemaTransform>[0]

export function transformSwaggerSchema(data: TransformSwaggerSchemaData) {
  const { schema, url } = jsonSchemaTransform(data)

  // 1. Verificamos se a rota é de multipart
  if (schema.consumes?.includes('multipart/form-data')) {
    // 2. Garantimos que o body existe e é um objeto para o Swagger
    if (!schema.body || typeof schema.body !== 'object') {
      schema.body = {
        type: 'object',
        properties: {},
        required: [],
      }
    }

    // Usamos um cast para 'any' para facilitar a manipulação da estrutura JSON
    const body = schema.body as any

    // 3. Garantimos que properties e required existam
    body.properties = body.properties || {}
    body.required = body.required || []

    // 4. Definimos o campo de arquivo no formato que o Swagger entende (binary)
    body.properties.file = {
      type: 'string',
      format: 'binary',
      description: 'O arquivo a ser enviado',
    }

    // 5. Adicionamos aos obrigatórios apenas se não estiver lá
    if (!body.required.includes('file')) {
      body.required.push('file')
    }
  }

  return { schema, url }
}
