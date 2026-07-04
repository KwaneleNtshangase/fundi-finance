declare module "pdfjs-dist/build/pdf.mjs" {
  export function getDocument(params: {
    data: Uint8Array;
    password?: string;
    useSystemFonts?: boolean;
    disableFontFace?: boolean;
  }): { promise: Promise<{
    numPages: number;
    getPage: (n: number) => Promise<{
      getTextContent: () => Promise<{ items: { str: string; transform: number[] }[] }>;
    }>;
  }> };

  export const PasswordResponses: {
    NEED_PASSWORD: number;
    INCORRECT_PASSWORD: number;
  };
}
