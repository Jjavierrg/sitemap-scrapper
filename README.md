# Sitemap notification scrapper

This is a serverless scrapper solution for sitemap notification. It is a simple solution that scrapes the updated pages on a desired sitemap and sends an email to the user according to the user's preferences.

It runs every hour and checks if there are any updates on sitemap pages. Stores the pages in a DynamoDB table and sends an email to the user if there are new updated pages.

## Architecture

![Esquema](https://user-images.githubusercontent.com/3964098/214833989-76d8d66e-7ad8-4706-b7ed-514385cdbd10.png)

## Prerequisites

You will need the following tools:

- AWS Account and User
- AWS CLI
- NodeJS
- AWS CDK Toolkit
- Docker

## Installation

After installing the prerequisites and configuring your AWS credentials, you can deploy the solution in your AWS account using the following commands

```bash
  npm npm run install-all
  npm run synth
  npm run deploy
```
    

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npm run deploy` deploy this stack to your default AWS account/region
- `npm run synth` emits the synthesized CloudFormation template
- `npm run install-all` install all dependencies for all projects

## Authors

- **José Javier Rodríguez Gallego** - _Initial work_ - [jjavierrg](https://github.com/jjavierrg)
