import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { coDatabase } from './database';
import { coLambda } from './lambda';
import { coSns } from './sns';

export class ssStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const database = new coDatabase(this, 'Database');
    const sns = new coSns(this, 'Sns');
    const lambda = new coLambda(this, 'Lambda', database.table, sns.topic);
  }
}
