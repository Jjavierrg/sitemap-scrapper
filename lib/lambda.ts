import { CfnOutput, Duration } from 'aws-cdk-lib';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { join } from 'path';

export class coLambda extends Construct {
  constructor(scope: Construct, id: string, table: ITable, topic: ITopic) {
    super(scope, id);

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk' // Use the 'aws-sdk' available in the Lambda runtime
        ]
      },
      environment: {
        DYNAMODB_TABLE_NAME: table.tableName,
        URL: 'https://services.athlon.com/api/irt/secured/employee/athloncaroutletes/version/search',
        MAX_PRICE: '40000',
        MAX_KMS: '40000',
        NODE_OPTIONS: '--no-warnings',
        SNS_TOPIC_ARN: topic.topicArn
      },
      runtime: Runtime.NODEJS_18_X,
      description: 'Lambda function to scrape new cars from the website',
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

    const funcUrl = func.addFunctionUrl({ authType: FunctionUrlAuthType.NONE });
    new CfnOutput(this, 'invokeURL', {
      value: funcUrl.url,
      description: 'Invoke URL for the function'
    });

    table.grantReadWriteData(func);
    topic.grantPublish(func);
  }
}
