import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

export const getDidWeb = async (event: AWSLambda.APIGatewayEvent) => {
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
  } = result.Item ?? { wellKnownDid: { S: undefined } };

  if (!wellKnownDid) {
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: wellKnownDid,
  };
};
