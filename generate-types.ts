import 'cross-fetch/polyfill'
import { ApolloClient, gql } from '@apollo/client/core'
import { InMemoryCache } from '@apollo/client/cache'
import { getCurrentLogger } from './src/includes/logger'
import { buildSchema, printSchema, parse, GraphQLSchema } from 'graphql'
import * as fs from 'fs'
import * as path from 'path'
import * as typescriptPlugin from '@graphql-codegen/typescript'
import { codegen } from '@graphql-codegen/core'

const logger = getCurrentLogger('generate-types')

const client = new ApolloClient({
  uri: 'https://api.kards.com/graphql',
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'ignore'
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    }
  }
})

async function getSchema (): Promise<string | undefined> {
  try {
    var result = await client.query({ query: gql`query { _service { sdl } }` })
    logger.debug(result)
    if (result.error != null || result.errors != null) {
      logger.warn(result.error ?? result.errors)
      var errors = result.error?.message ?? ''
      for (var entry of result.errors ?? []) {
        errors += errors === '' ? entry.message : `, ${entry.message}`
      }
      throw new Error(errors)
    } else if (result.data._service === undefined || result.data._service.sdl === undefined) {
      logger.warn('No kards version found')
      return undefined
    } else {
      logger.silly('Preparing output')
      return result.data._service.sdl.replace(/\\n/g, '')
    }
  } catch (e) {
    logger.error(e)
    throw e
  }
}

getSchema().then((schemaString) => {
  if (schemaString !== undefined) {
    logger.silly('Preparing schema')
    const schema: GraphQLSchema = buildSchema(schemaString, {
      assumeValidSDL: true
    })
    logger.silly('Preparing output File')
    const outputFile = path.join(__dirname, './types/kards-web.d.ts')
    logger.silly('Preparing config')
    const config = {
      documents: [],
      config: {
        enumsAsTypes: true,
        futureProofEnums: true,
        futureProofUnions: true,
        maybeValue: 'T | null | undefined'
      },
      filename: outputFile,
      schema: parse(printSchema(schema)),
      plugins: [
        {
          typescript: {}
        }
      ],
      pluginMap: {
        typescript: typescriptPlugin
      }
    }
    logger.silly('Code gen-ing')
    codegen(config).then((output) => {
      logger.silly('File saving')
      output += `
      export interface KardsApiErrorJson {
        status_code: Scalars['Int']
        message: Scalars['String']
        error: {
          code: Scalars['String']
          description: Scalars['String']
        }
      }
      `
      fs.writeFile(outputFile, output, () => {
        logger.info('TS generated!')
        process.exit(0)
      })
    }).catch((e) => {
      logger.error('Unable to generate TS file')
      logger.error(e)
      process.exit(1)
    })
  } else {
    logger.error('Schema string is undefined')
    process.exit(1)
  }
}).catch((e) => {
  logger.error('Unable to get schema')
  logger.error(e)
  process.exit(1)
})
