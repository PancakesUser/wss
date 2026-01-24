let kickUserWrote: boolean = false;
let kickBotWrote: boolean = false;

function updateKUWState(value: boolean): void {
    kickUserWrote = value
} 

function updateKBWState(value: boolean): void {
    kickBotWrote = value;
}

export {kickUserWrote, kickBotWrote, updateKUWState, updateKBWState};