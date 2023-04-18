import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { sitemapDatabase } from './database';
import { sitemapLambda } from './lambda';

export class ssStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const database = new sitemapDatabase(this, 'Database');
    const lambda = new sitemapLambda(this, 'Lambda', database.table);
  }
}
