declare global {
    namespace NodeJS {
      interface ProcessEnv {
        [key: string]: string | undefined;
        PORT: number;
        DATABASE_URL: string;
        CLIENT_ID: string;
        CLIENT_SECRET: string;
        // add more environment variables and their types here
      }
    }
  }
  