import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { CryptoSuite, generateKeyPair, issueDID, VerificationType } from "@trustvc/w3c-issuer";
import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator";

export const postDidWeb = async (event: AWSLambda.APIGatewayEvent, context: AWSLambda.Context) => {
  try {
    const name = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals], separator: "-" });
    const domain = `${name}.${process.env.DID_DOMAIN}`;

    const requestBody = event?.body
      ? (() => {
          try {
            return JSON.parse(event.body);
          } catch (err) {
            console.error("Failed to parse request body", err);
            return {};
          }
        })()
      : {};

    const { type } = requestBody;
    const issuedDidWeb = await (type === CryptoSuite.EcdsaSd2023
      ? issueDID({
          domain,
          type,
        })
      : (async () => {
          const keyPair = await generateKeyPair({
            type: VerificationType.Bls12381G2Key2020,
          });
          return issueDID({
            domain,
            ...keyPair,
          });
        })());

    const client = new DynamoDBClient({
      region: "ap-southeast-1",
    });

    await client.send(
      new PutItemCommand({
        TableName: `didweb-${process.env.STAGE}`,
        Item: {
          id: { S: domain },
          ttl: { N: (Date.now() + Number(process.env.RECORD_EXPIRY_TIME) * 1000).toString() },
          wellKnownDid: { S: JSON.stringify(issuedDidWeb.wellKnownDid) },
          didKeyPairs: { S: JSON.stringify(issuedDidWeb.didKeyPairs) },
        },
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        requestId: context.awsRequestId,
        domain,
        wellKnownDid: issuedDidWeb.wellKnownDid,
        didKeyPairs: issuedDidWeb.didKeyPairs,
      }),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        requestId: context.awsRequestId,
        error: e.message,
      }),
    };
  }
};
