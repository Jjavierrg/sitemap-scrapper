import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class sitemapDatabase extends Construct {
  public readonly table: ITable;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.table = new Table(this, 'sitemapScrapper', {
      partitionKey: {
        name: 'site',
        type: AttributeType.STRING
      },
      tableName: 'sitemapScrapper',
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });
  }
}
