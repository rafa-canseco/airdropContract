import axios from "axios";

const BASE_URL = "https://api.routescan.io/v2/network/mainnet/evm/43114/erc20/0x1785d6F5B076d93EfAE079744D0c86F2aC77621f/holders"
const PARAMS= 
"ecosystem=avalanche&includedChainIds=43114%2C73772&direction=sent&count=true&limit=100";


export async function fetchHolders(){
    let nextToken = ""
    let retries = 0;
    const MAX_RETRIES = 5;
    const addresses = [];

    while(true){
        try{
            const url = `${BASE_URL}?${PARAMS}${
                nextToken ? `&next=${nextToken}` : ""
              }`;
              const response = await axios.get(url);
              const data = response.data;

              data.items.forEach((address: {address: string}) => {
                    addresses.push(address.address);
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

