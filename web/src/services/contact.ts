import request from "@/utils/request"

export const createContact = async (data: Contact): Promise<Contact> => {
    return request(`/contact`, { method: "POST", data })
}

export const queryContact = async (conditions: Record<string, unknown>): Promise<Contact[]> => {
    return request(`/contact`, { method: "GET", params: conditions })
}

export const queryContactById = async (id: string): Promise<Contact> => {
    return request(`/contact/${id}`, { method: "GET" })
}

export const updateContact = async (data: Contact): Promise<Contact[]> => {
    return request(`/contact`, { method: "PATCH", data })
}

export const deleteContact = async (id: string): Promise<Contact[]> => {
    return request(`/contact/${id}`, { method: "DELETE" })
}

export const queryContactByName = async (name: string): Promise<Contact[]> => {
    return request(`/contact/search`, { method: "GET", params: { name } })
}