import chalk from 'chalk';
import ora from 'ora';

export class Logger {
    private static spinner = ora();

    static info(message: string) {
        console.log(chalk.blue('ℹ'), message);
    }

    static success(message: string) {
        console.log(chalk.green('✓'), message);
    }

    static error(message: string) {
        console.error(chalk.red('✖'), message);
    }

    static warn(message: string) {
        console.warn(chalk.yellow('⚠'), message);
    }

    static startSpinner(message: string) {
        this.spinner.start(message);
    }

    static stopSpinner() {
        this.spinner.stop();
    }

    static spinnerSuccess(message: string) {
        this.spinner.succeed(message);
    }

    static spinnerError(message: string) {
        this.spinner.fail(message);
    }

    static printPDA(label: string, address: string) {
        console.log(chalk.dim(label + ':'), chalk.cyan(address));
    }

    static printInstructions(message: string) {
        console.log('\n' + chalk.yellow('!'), chalk.bold('Instructions:'));
        console.log(chalk.yellow('→'), message);
    }
} 