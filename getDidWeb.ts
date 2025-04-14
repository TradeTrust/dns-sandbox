import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent } from "aws-lambda";

export const getDidWeb = async (event: APIGatewayEvent) => {
  if (!event.requestContext.domainName) throw new Error("Please provide a domain name");
  const client = new DynamoDBClient({
    region: "ap-southeast-1",
  });

  const result = await client.send(
    new GetItemCommand({
      TableName: `didweb-${process.env.STAGE}`,
      Key: {
        id: { S: `${event.requestContext.domainName}` },
      },
    })
  );

  const {
    wellKnownDid: { S: wellKnownDid },
  } = result.Item ?? {};

  if (!wellKnownDid) {
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: wellKnownDid,
  };
};
