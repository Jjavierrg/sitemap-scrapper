import { Duration } from 'aws-cdk-lib';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';

export class sitemapLambda extends Construct {
  constructor(scope: Construct, id: string, table: ITable) {
    super(scope, id);

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk' // Use the 'aws-sdk' available in the Lambda runtime
        ]
      },
      environment: {
        ENTRIES_TABLE: table.tableName,
        TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN ?? '',
        TELEGRAM_CHAT_IDS: process.env.TELEGRAM_CHAT_IDS ?? '',
        ROOT_SITEMAP_URL: process.env.ROOT_SITEMAP_URL ?? '',
        NODE_OPTIONS: '--no-warnings'
      },
      runtime: Runtime.NODEJS_18_X,
      description: 'Lambda function to scrape website sitempas and send notifications of new entries',
      functionName: 'sitemap-scrapper',
      timeout: Duration.seconds(20)
    };

    const func = new NodejsFunction(this, 'sitemap-scrapper', {
      entry: join(__dirname, `/../lambdas/scrapper/index.ts`),
      ...nodeJsFunctionProps
    });

    const eventRule = new Rule(this, 'scheduleRule', {
      schedule: Schedule.cron({
        minute: '0',
        hour: '7-21/2',
        weekDay: 'MON-SAT',
        month: '*',
        year: '*'
      })
    });
    eventRule.addTarget(new LambdaFunction(func));

    table.grantReadWriteData(func);
  }
}
