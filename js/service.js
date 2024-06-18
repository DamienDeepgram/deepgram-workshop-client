const service = {
  
    deleteMenu: async () => {
      const response = await fetch(`${BASE_URL}/menu/items`, {
        method: "DELETE",
        headers: this.headers,
      });
      if (!response.ok) {
        throw new Error("Failed to delete menu items");
      }
      return response;
    },
  
    addToMenu: async (item) => {
      const response = await fetch(`${BASE_URL}/menu/items`, {
        method: "POST",
        body: JSON.stringify(item),
        headers: {
          "Content-Type": "application/json",
          ...this.headers,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to add menu item");
      }
      return response;
    },
  
    getMenu: async () => {
      const menu = await fetch(`${BASE_URL}/menu`, {
        method: "GET",
        headers: this.headers,
      });
      if (!menu.ok) {
        throw new Error("Failed to fetch menu");
      }
  
      const menuJSON = await menu.json();
      return menuJSON;
    },
  
    getCallID: async () => {
      const callID = await fetch(`${BASE_URL}/calls`, {
        method: "POST",
        headers: this.headers,
      });
      if (!callID.ok) {
        throw new Error("Failed to get call ID");
      }
  
      const callIDText = await callID.text();
      return callIDText;
    },
  
    getOrder: async (callID) => {
      const order = await fetch(`${BASE_URL}/calls/${callID}/order`, {
        method: "GET",
        headers: this.headers,
      });
      if (!order.ok) {
        throw new Error("Failed to get order");
      }
  
      const orderJSON = await order.json();
      return orderJSON.items;
    }
  }