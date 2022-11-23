import request from "@/utils/request"

export const createStock = async (data: Stock): Promise<Stock> => {
    return request(`/stock`, { method: "POST", data })
}

export const queryStock = async (conditions: Record<string, unknown>): Promise<Stock[]> => {
    return request(`/stock`, { method: "GET", params: conditions })
}

export const queryStockById = async (id: string): Promise<Stock[]> => {
    return request(`/stock/${id}`, { method: "GET" })
}

export const updateStock = async (id: string): Promise<Stock[]> => {
    return request(`/stock`, { method: "PATCH" })
}

export const deleteStock = async (id: string): Promise<Stock[]> => {
    return request(`/stock/${id}`, { method: "DELETE" })
}