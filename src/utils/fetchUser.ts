import axios, { type AxiosResponse} from "axios";

export async function fetchUserLVL(): Promise<AxiosResponse> {
    const response = await axios({
        method: "GET",
        url: "https://botrix.live//api/public/leaderboard?platform=kick&user=streameruniversitario&search=Hyzun",
    });
    return response;
}

