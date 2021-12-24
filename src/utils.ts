export const IsPC = () => {
    const { userAgent } = navigator;
    const Agents = ['Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod'];
    let flag = true;
    for (const agent of Agents) {
        if (userAgent.indexOf(agent) > 0) {
            flag = false;
            break;
        }
    }
    return flag;
};