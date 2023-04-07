import { PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { PublishCommand } from '@aws-sdk/client-sns';
import { marshall } from '@aws-sdk/util-dynamodb';
import { ddbClient } from './clients/ddbClient';
import { snsClient } from './clients/snsClient';
import { Car } from './models/car';
import { Response } from './models/response';

async function getData(): Promise<Response> {
  const url = process.env.URL!;
  const response = await fetch(url, {
    headers: {
      accept: '*/*',
      'content-type': 'application/json'
    },
    body: '{"pagination":{"pageNumber":1,"pageSize":8000},"sorts":[{"field":"makeModel","direction":"ASC"}],"query":"","queryGroups":[{"concatenator":"AND","queryParts":[{"field":"transmissionType","values":["Automatic"]}]}]}',
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const data = await response.json();
  return data as Response;
}

async function filterNewCars(cars: Car[]): Promise<Car[]> {
  if (!cars?.length) {
    return [];
  }

  const keys: string[] = cars.map((car) => car.actionModelCode);
  const filterExpression = `actionModelCode IN (:${keys.join(', :')})`;
  const expressionAttributeValues = keys.reduce((acc: any, key: string) => {
    acc[`:${key}`] = key;
    return acc;
  }, {});

  const command = new ScanCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME,
    ProjectionExpression: 'actionModelCode',
    FilterExpression: filterExpression,
    ExpressionAttributeValues: marshall(expressionAttributeValues)
  });

  const { Items } = await ddbClient.send(command);
  const newCars = cars.filter((car) => !Items?.some((item) => item.actionModelCode.S === car.actionModelCode));
  console.log(`Found ${newCars.length} new cars`);

  return newCars;
}

async function saveCar(car: Car): Promise<void> {
  const command = new PutItemCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Item: marshall(car || {})
  });

  await ddbClient.send(command);

  console.log(`Saved car ${car.actionModelCode}`);
}

function getCarDescription(car: Car): string {
  const fields = [];
  fields.push(car.makeModelVersion);
  fields.push(`AÑO: ${car.firstRegistrationDate}`);
  fields.push(`PRECIO: ${car.occasionPrice}€`);
  fields.push(`KMS: ${car.lastKnownMileage}km`);
  fields.push(`https://www.athloncaroutlet.es/buscar-coches/${car.makeUrl}/${car.modelUrl}/${car.actionModelCode}`);

  return fields.join(' | ');
}

function getCarsMessage(cars: Car[], title: string): string {
  if (!cars?.length) {
    return '';
  }

  let message = `---- ${title} ----\n`;
  message += cars.map(getCarDescription).join('\n\n');

  return message;
}

async function notifyNewCars(cars: Car[]): Promise<string> {
  const maxPrice: number = +process.env.MAX_PRICE!;
  const maxKm: number = +process.env.MAX_KMS!;
  const newCars = cars.filter((car) => car.occasionPrice > maxPrice || car.lastKnownMileage > maxKm);
  const interestedCars = cars.filter((car) => car.occasionPrice <= maxPrice && car.lastKnownMileage <= maxKm);

  let message: string = '';
  message += getCarsMessage(interestedCars, '🤩 COCHES COINCIDENTES 🤩');
  message += '\n\n';
  message += getCarsMessage(newCars, '🚗 NUEVOS COCHES AÑADIDOS 🚗');

  await snsClient.send(new PublishCommand({ TopicArn: process.env.SNS_TOPIC_ARN, Message: message.trim(), Subject: 'Nuevos coches' }));
  return message;
}

export async function handler(): Promise<string> {
  try {
    console.log('Running...');

    const response = await getData();
    const cars = response.versions;
    const newCars = await filterNewCars(cars);

    if (!newCars?.length) {
      return 'No new cars found';
    }

    for (const car of newCars) {
      await saveCar(car);
    }

    const message = await notifyNewCars(newCars);

    return message;
  } catch (error) {
    console.error(JSON.stringify(error));
    return 'Error: ${error}';
  }
}
