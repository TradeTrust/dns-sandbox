## Test

1. export DOMAIN=sandbox.openattestation.com
1. export HOSTED_ZONE_ID=<hosted_zone_id>
1. export AWS_ACCESS_KEY_ID=<access_key>
1. export AWS_SECRET_ACCESS_KEY=<secret_key>
1. npx serverless deploy
1. retrieve url from deployment
1. E2E_URL=<deployed_url> npm run test:watch

> By default, this deployment will replace the `stg` environment.

### Seconds to:

- 3600 = 1 hour
- 86400 = 1 day
- 604800 = 7 days
- 2592000 = 30 days

### Debugging locally

Be sure to have the appropriate variables in your `.env`. Refer to seed.run for those. For STATE_MACHINE_ARN, refer to aws step functions > state machines.

- run `sls step-functions-offline --stateMachine=records --event=local-event.json`

`records` is the variable name defined under `stateMachines` in serverless.yml. `local-event.json` is a mock event. Running the above command will add a txt record to aws route53, wait, then clean the txt record.

- run `npm run dev`

^ this should allow you to debug `getExecutionDetails` function
