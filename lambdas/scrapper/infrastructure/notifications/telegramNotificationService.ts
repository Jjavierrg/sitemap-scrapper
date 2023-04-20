import * as https from 'https';
import { Entry } from '../../models/entry';

export class TelegramNotificationService {
  private readonly token: string | undefined;
  private readonly chatId: string[];

  constructor() {
    this.token = process.env.TELEGRAM_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_IDS?.split(',') ?? [];
  }

  /**
   * @inheritdoc
   */
  public async notifyNewEntries(entries: Entry[]): Promise<void> {
    if (!entries.length) {
      return;
    }

    const message = entries.map((entry) => `Se actulizó la URL ${entry.site} (${new Date(entry.updatedDate).toLocaleString()})`).join('\n');
    return this.sendMessage(message);
  }

  /**
   * Sends a message to all Telegram chats
   * @param message Message to send
   * @returns Promise that resolves when the message is sent
   */
  private async sendMessage(message: string): Promise<void> {
    if (!this.token || !this.chatId.length || !message) {
      return Promise.resolve();
    }

    for (const chatId of this.chatId) {
      await this.sendMessageToChat(message, chatId);
    }
  }

  /**
   * Sends a message to a specific Telegram chat
   * @param message Message to send
   * @param chatId Telegram chat ID
   * @returns Promise that resolves when the message is sent
   * @see https://core.telegram.org/bots/api#sendmessage
   */
  private sendMessageToChat(message: string, chatId: string): Promise<void> {
    const uriEncodedMessage = encodeURIComponent(message.replace(/\n/g, '%0A'));
    const endpointUrl = `https://api.telegram.org/bot${this.token}/sendMessage?chat_id=${chatId}&text=${uriEncodedMessage}`;
    return new Promise((resolve, reject) => {
      https.get(endpointUrl, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Request failed with status code ${res.statusCode}`));
        }
        resolve(undefined);
      });
    });
  }
}
