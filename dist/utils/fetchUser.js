import axios from "axios";
export async function fetchUserLVL() {
    const response = await axios({
        method: "GET",
        url: "https://botrix.live//api/public/leaderboard?platform=kick&user=streameruniversitario&search=Hyzun",
    });
    return response;
}
//# sourceMappingURL=fetchUser.js.map