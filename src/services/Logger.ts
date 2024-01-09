
export class Logger {
    static getLoggerMessage(logType: string, content: any) {
      function addTwoDigits(value: string | number) {
        const valueFormatted = `0${value}`.slice(-2);
        return valueFormatted;
      }

      const now = new Date();

      const day = addTwoDigits(now.getDay());
      const month = addTwoDigits(now.getMonth());
      const year = addTwoDigits(now.getFullYear());
  
      const hours = addTwoDigits(now.getHours());
      const minutes = addTwoDigits(now.getMinutes());
      const seconds = addTwoDigits(now.getSeconds());
  
      const formattedDate = `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
  
      return `${logType} ${formattedDate}  ${content}`;
   }

   static websocketLog(action: string, message: string, content?: string) {
    console.log('\x1b[4m%s\x1b[0m\n', this.getLoggerMessage('[WS]', action));
    console.log('\x1b[1m\x1b[46m %s \x1b[0m \n %s', message, content);
    console.log('\n\n');
   }

   static cryptoLog(action: string, message: string, content?: string) {
    console.log('\x1b[4m%s\x1b[0m\n', this.getLoggerMessage('[CRYPTO]', action));
    // console.log('\x1b[42m\x1b[37m%s\x1b[0m', this.getLoggerMessage('[CRYPTO]', message));
    console.log('\x1b[1m\x1b[43m %s \x1b[0m \n %s', message, content);
    console.log('\n\n');
   }

   static operationLog(action: string, message: string, content?: string) {
    console.log('\x1b[4m%s\x1b[0m\n', this.getLoggerMessage('[OPERATION]', action));
    console.log('\x1b[1m\x1b[42m %s \x1b[0m \n %s', message, content);
    console.log('\n\n');
   }
}