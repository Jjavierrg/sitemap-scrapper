import { ITopic, Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export class coSns extends Construct {
  public topic: ITopic;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.topic = new Topic(this, 'sitemap-pages', { displayName: 'Sitemap notification topic' });

    const emails = process.env.EMAILS?.split(',') || [];
    emails.forEach((email) => this.topic.addSubscription(new EmailSubscription(email.trim())));
  }
}
