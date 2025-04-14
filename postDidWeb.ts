import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { generateKeyPair, issueDID, VerificationType } from "@trustvc/w3c-issuer";
import { Context } from "aws-lambda";
import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator";

export const postDidWeb = async (event: unknown, context: Context) => {
  try {
    const name = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals], separator: "-" });
    const domain = `${name}.${process.env.DOMAIN}`;

    const client = new DynamoDBClient({
      region: "ap-southeast-1",
    });

    // Generate a key pair
    const keyPair = await generateKeyPair({
      type: VerificationType.Bls12381G2Key2020,
    });

    // Generate DID document
    const issuedDidWeb = await issueDID({
      domain,
      ...keyPair,
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
      },
      body: JSON.stringify({
        requestId: context.awsRequestId,
        error: e.message,
      }),
    };
  }
};
