import axios, { type AxiosResponse } from "axios";


export async function askForToken(): Promise<AxiosResponse<any, any> | undefined> {
    try{
        const response = await axios({
            url: "http://localhost:3000/token",
            withCredentials: true,
            method: "GET"
        });
        return response;
    }catch(error: unknown) {
        console.error(`Something went wrong trying to ask for token: `);
    }
}