export const handler = async (event: any = {}) : Promise <any> => {
    console.log(event);
    event.Records.forEach((record: any) => {
        console.log('Event Id: %s', record.eventID);
        console.log('Event Id: %s', record.eventName);
        console.log('DynamoDB Record: %j', record.dynamodb);
    });
    return { statusCode: 201, body: 'Hello world!' };
};