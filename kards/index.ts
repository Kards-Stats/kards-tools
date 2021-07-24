import getAllEndpoints from './endpoints'
import {
  authenticatedRequest,
  authenticatedPost,
  publicGet,
  publicPost,
  getPath,
  kardsRequest
} from './kards-request'
import KardsApiError from './kards-api-error'
import {
  getCompatibleVersions,
  getKardsSessionEndpoint
} from './public-endpoints'
import KardsSession from './session'
import KardsVersion from './version'

export default {
  endpoints: {
    getAllEndpoints,
    getCompatibleVersions,
    getKardsSessionEndpoint
  },
  request: {
    authenticatedRequest,
    authenticatedPost,
    publicGet,
    publicPost,
    getPath,
    kardsRequest
  },
  KardsApiError,
  KardsSession,
  KardsVersion
}
