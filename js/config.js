const state = {
    status: 'awake',
    callID: null,
    menu: {items:[]},
    order: [],
    initializedDriveThru: false
};

const BASE_URL = 'https://deepgram-workshop-server.glitch.me';
const baseConfig = {
    type: "SettingsConfiguration",
    audio: {
        input: {
            encoding: "linear16",
            sample_rate: 16000
          },
          output: {
            encoding: "linear16",
            sample_rate: 48000,
            container: "none",
            buffer_size: 250,
          }
    },
    agent: {
        listen: { model: "nova-2" },
        speak: { model: "aura-athena-en" },
    },
}

function getDriveThruStsConfig(callID, menu) {
    return {
        ...baseConfig,
        agent: {
            ...baseConfig.agent,
            think: {
                provider: {
                    type: "groq",
                },
                model: "llama3-70b-8192",
                instructions: `
                    You work taking orders at a drive-thru. Only respond in 2-3 sentences at most. 
                    Don't mention prices until the customer confirms that they're done ordering. 
                    The menu, including the names, descriptions, types, and prices for the items that you sell, is as follows: ${menu}
                `,
                functions: [
                    {
                        name: "add_item",
                        description: "Add an item to an order. Only items on the menu are valid items.",
                        parameters: {                            
                            type: "object",
                            properties: {
                                item: {
                                    type: "string",
                                    description: `
                                        The name of the item that the user would like to order. 
                                        The valid values are only those on the menu
                                    `,
                                },
                            },
                            required: ["item"],
                        },
                        url: BASE_URL + "/calls/" + callID + "/order/items",
                        method: "post",   
                    }
                ],
            }
        },
    };
}

const driveThruMenu = [
    {
        name: "Krabby Patty",
        description: "The signature burger of the Krusty Krab, made with a secret formula",
        price: 2.99,
        category: "meal",
    },
    {
        name: "Double Krabby Patty",
        description: "A Krabby Patty with two patties.",
        price: 3.99,
        category: "meal",
    },
    {
        name: "Krabby Patty with Cheese",
        description: "A Krabby Patty with a slice of cheese",
        price: 3.49,
        category: "meal",
    },
    {
        name: "Double Krabby Patty with Cheese",
        description: "A Krabby Patty with two patties and a slice of cheese",
        price: 4.49,
        category: "meal",
    },
    {
        name: "Salty Sea Dog",
        description: "A hot dog served with sea salt",
        price: 2.49,
        category: "meal",
    },
    {
        name: "Barnacle Fries",
        description: "Fries made from barnacles",
        price: 1.99,
        category: "side",
    },
    {
        name: "Krusty Combo",
        description: "Includes a Krabby Patty, Seaweed Salad, and a drink",
        price: 6.99,
        category: "combo",
    },
    {
        name: "Seaweed Salad",
        description: "A fresh salad made with seaweed",
        price: 2.49,
        category: "side",
    },
    {
        name: "Krabby Meal",
        description: "Includes a Krabby Patty, fries, and a drink",
        price: 5.99,
        category: "combo",
    },
    {
        name: "Kelp Shake",
        description: "A shake made with kelp juice",
        price: 2.49,
        category: "beverage",
    },
    {
        name: "Bubbly buddy",
        description: "A drink that is bubbly and refreshing",
        price: 1.49,
        category: "beverage",
    }
]