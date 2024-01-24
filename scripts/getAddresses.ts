import axios from "axios";

const BASE_URL = "https://api.routescan.io/v2/network/mainnet/evm/43114/erc20/0x1785d6F5B076d93EfAE079744D0c86F2aC77621f/holders"
const PARAMS= 
"ecosystem=avalanche&includedChainIds=43114%2C73772&direction=sent&count=true&limit=100";
const MIN_BALANCE = 25000000000;

export async function fetchHolders(){
    let nextToken = ""
    let retries = 0;
    const MAX_RETRIES = 5;
    let addresses = [];

    while(true){
        try{
            const url = `${BASE_URL}?${PARAMS}${nextToken ? `&next=${nextToken}` : ""}`;
            const response = await axios.get(url);
            const data = response.data;

            data.items.forEach((holder: {address: string, balance: string}) => {
                const balance = parseInt(holder.balance, 10);
                if (balance > MIN_BALANCE &&
                    holder.address !== "0x1785d6F5B076d93EfAE079744D0c86F2aC77621f" &&
                    holder.address !== "0x5Ac6F8695C7e02e97d89ae20FD26a143073AbfB4" &&
                    holder.address !== "0x7862436B7d796F6b2cB19C949f848aBC4EBaE655" &&
                    holder.address !== "0xf77414Cb7D5Da12B56517c4cB83e78A70CbCbC33" &&
                    holder.address !== "0x6FB0E3f87f1F0549dE65Cd35Ac8DD3922fC1910E") {
                    addresses.push(holder.address);
                }
            });

            if (data.link && data.link.nextToken) {
                nextToken = data.link.nextToken;
                retries = 0;
            } else {
                console.log("Se han buscado todos los addresses");

                break;
            }
        } catch (error) {
            console.error("Error al obtener los holders:", error);
            retries++;
            if (retries > MAX_RETRIES) {
                throw new Error("Número máximo de reintentos alcanzado");
            }
            console.log(`Reintentando... (${retries}/${MAX_RETRIES})`);
            await new Promise((resolve) => setTimeout(resolve, 10000));
        }
    }
    return addresses;
}

