export const productSchema = {
  type: "object",
  required: ["title", "price"],
  allOf: [
    {
      properties: {
        title: {
          type: "string",
        },
        price: {
          type: "string",
        },

      },
      additionalProperties: true,
    },
  ],
  errorMessage: {
    type: "data should be an object",
    properties: {
      title: "title requierd",
      price: "price requierd",
    },
    _: 'data should have properties "requierd" and "title"',
  },
};
