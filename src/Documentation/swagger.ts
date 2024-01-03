import swaggerJsDoc from "swagger-jsdoc";

const swaggerOptions: swaggerJsDoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "MediaGlens",
      version: "1.0.0",
      description: `
Empower your applications with MediaGlens API to enhance and optimize your media assets effortlessly. Explore a comprehensive suite of features designed to streamline media processing tasks:

- **Optimize and customize images** to meet specific requirements, adjusting dimensions, quality, and format with ease.

- **Compress and store a wide range of file types**, including images, documents (docx, pdfs, ppts, xls), and more, saving storage space while preserving content integrity.

- **Perform complex image processing** tasks, including cropping, rotating, converting to grayscale, and more, achieving the desired visual output effortlessly.

- **Utilize secure and scalable storage options** for images ,videos and files, ensuring safe and reliable management of your media assets.Enjoy the best experience of AWS cloud storage

- **Benefit from streamlined integration** with your existing applications and services through a developer-friendly API designed for a seamless experience.

-**Offer streaming of videos** you can monetise your videos efficiently with my high performing api severs

Whether you're working with images, documents, or other digital media, MediaGlens API empowers you to optimize, compress, and manage your content efficiently. Unlock the full potential of your media assets and create engaging experiences with ease.
`,
contact:{
  name:"MediaGlens",
  url:"https://mediaglens.com",
  email:"ayiendaglen@gmail.com"
},
 license: {
        name: "MIT",
        url: "https://mediaglens.com/Licence"
     
    },
  },
    externalDocs: {
      description: "**VIEW CODE EXAMPLES**",
      url: "https://path-to-your-documentation/code-examples",
    },
    servers: [
      {
        url: "http://localhost:8080",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "API key required for authentication",
        },
        UserIdAuth: {
          type: "apiKey",
          in: "header",
          name: "x-user-id",
          description: "User ID required for authentication",
        },
      },
    },
  },

  apis: ["src/routes/index.ts"],
};

export const specs = swaggerJsDoc(swaggerOptions);
