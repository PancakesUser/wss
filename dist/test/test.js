import axios from "axios";
async function testfetch() {
    await axios({
        method: "GET",
        headers: {},
        url: "https://botrix.live//api/public/leaderboard?platform=kick&user=streameruniversitario&search=Hyzun",
        withCredentials: true
    })
        .then((results) => {
        console.log(results.data);
    });
}
testfetch();
//# sourceMappingURL=test.js.map