

export abstract class Command {

  printHelp(_options: any): void {
    this.printHelpUsage(this.name, this.arguments, this.options);
    this.printHelpOptions(this.options);
  }

  protected printHelpUsage(name: string, args: string[], options: Option[]) {
    const argDisplay = args && args.length > 0
      ? ' ' + args.map(a => `<${a}>`).join(' ')
      : '';
    const optionsDisplay = options && options.length > 0
      ? ` [options]`
      : ``;
    console.log(`usage: ng ${name}${argDisplay}${optionsDisplay}`);
  }

  protected printHelpOptions(options: Option[]) {
    if (options && this.options.length > 0) {
      console.log(`options:`);
      this.options
        .forEach(o => {
        const aliases = o.aliases && o.aliases.length > 0
          ? '(' + o.aliases.map(a => `-${a}`).join(' ') + ')'
          : '';
        console.log(`    ${aliases}`);
        console.log(`    ${o.description}`);
      });
    }
  }

  abstract run(options: any): any | Promise<any>;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly arguments: string[];
  abstract readonly options: Option[];
}

export abstract class Option {
    abstract readonly name: string;
    abstract readonly description: string;
    readonly default?: string | number | boolean;
    readonly required?: boolean;
    abstract readonly aliases?: string[];
    abstract readonly type: any;
  }
