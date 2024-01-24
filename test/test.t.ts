import {expect} from "chai"
import {ethers,network} from "hardhat"
import { NewDistributor__factory } from "../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { fetchHolders } from "../scripts/getAddresses"

describe("newDistributor", function () {
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addr3: SignerWithAddress;
    let distributor: Distributor;
    let addressImpersonator: string;
    

    beforeEach(async function () {
        [owner,addr1,addr2,addr3] = await ethers.getSigners();
        const newDistributorFactory = (await ethers.getContractFactory("newDistributor", owner)) as NewDistributor__factory;
        distributor = await newDistributorFactory.deploy(owner.address) as Distributor;
        await distributor.waitForDeployment(2);
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await distributor.owner()).to.equal(owner.address);
        })
        it("should set a new tokenToTrack and emit the right event", async function () {
            const tokenTrackable = "0x1785d6F5B076d93EfAE079744D0c86F2aC77621f"
            await expect(distributor.registerTokenToTrack(tokenTrackable))
                .to.emit(distributor, 'TokenToTrackRegistered')
                .withArgs(tokenTrackable);
            expect(await distributor.tokenToTrack()).to.equal(tokenTrackable);
            
        })
        it("should set a new airdropToken and emit the right event", async function() {
            const airdropToken = "0x4F94b8AEF08c92fEfe416af073F1Df1E284438EC"
            await expect(distributor.registerAirdropToken(airdropToken))
                .to.emit(distributor, 'AirdropTokenRegistered')
                .withArgs(airdropToken);
            await distributor.registerAirdropToken(airdropToken)
            expect(await distributor.airdropToken()).to.equal(airdropToken)
        })
        it("debería registrar las direcciones dadas y añadirlas a la lista", async function() {
            const tokenTrackable = "0x1785d6F5B076d93EfAE079744D0c86F2aC77621f"
            distributor.registerTokenToTrack(tokenTrackable)
            const direcciones = await fetchHolders()
            await distributor.registerHolders(direcciones);
            for (const direccion of direcciones) {
                expect(await distributor.isHolder(direccion)).to.be.true;
            }
        });
        it("debería calcular los porcentajes de los tenedores correctamente y asegurar que no sean 0", async function() {
            const tokenTrackable = "0x1785d6F5B076d93EfAE079744D0c86F2aC77621f";
            await distributor.registerTokenToTrack(tokenTrackable);
            const tokenToTrackContract = await ethers.getContractAt("IERC20", tokenTrackable);
            const totalSupply = await tokenToTrackContract.totalSupply();
            const porcentajesEsperados = {};
            const direcciones = await fetchHolders();
            await distributor.registerHolders(direcciones);
            const scaleFactor = BigInt(10**18);
            let sumaPorcentajes = BigInt(0);
            for (const direccion of direcciones) {
                const balance = await tokenToTrackContract.balanceOf(direccion);
                const balanceBigInt = BigInt(balance.toString());
                const totalSupplyBigInt = BigInt(totalSupply.toString());
                const porcentaje = (balanceBigInt * scaleFactor * BigInt(100)) / totalSupplyBigInt;
                porcentajesEsperados[direccion] = porcentaje;
                sumaPorcentajes += porcentaje;
            }
            expect(sumaPorcentajes).to.be.greaterThan(BigInt(0), "La suma de porcentajes no puede ser 0");
    
            // Establecer el tamaño del lote antes de procesar los porcentajes
            const batchSize = 50; // Asumiendo que quieres procesar 50 direcciones a la vez
            await distributor.setBatchSize(batchSize);
    
            // Procesar los porcentajes en lotes hasta que todos los holders hayan sido procesados
            let totalHoldersProcessed = 0;
            while (totalHoldersProcessed < direcciones.length) {
                await distributor.processPercentagesInBatches();
                totalHoldersProcessed += batchSize;
            }
    
            // Verificar que los porcentajes calculados en el contrato coincidan con los esperados
            for (const direccion of direcciones) {
                const holderPercentage = await distributor.holderPercentages(direccion);
                expect(BigInt(holderPercentage)).to.equal(porcentajesEsperados[direccion]);
            }
        });
        
        it("should reset the holders adressess",async function () {
            const tokenTrackable = "0x1785d6F5B076d93EfAE079744D0c86F2aC77621f"
            distributor.registerTokenToTrack(tokenTrackable)
            const direcciones = await fetchHolders()
            await distributor.registerHolders(direcciones);
            for (const direccion of direcciones) {
                expect(await distributor.isHolder(direccion)).to.be.true;
            }
            await distributor.resetHolders();
            for (const direccion of direcciones) {
                expect(await distributor.isHolder(direccion)).to.be.false;
            }
        })
        // it("should withdraw tokens from contract", async function() {
        //     const distributorAddress = await distributor.getAddress()
        //     const tokenAddress= "0x1785d6F5B076d93EfAE079744D0c86F2aC77621f"
        //     const tokenContract = await ethers.getContractAt("IERC20", tokenAddress);
        //     addressImpersonator = "0x6390D4b9f82f2b3fa4ceD4f57106e766Bff6c0Cc";
        //     await network.provider.request({
        //         method: "hardhat_impersonateAccount",
        //         params: [addressImpersonator]
        //     });
        //     const amount = ethers.parseUnits("10000069",18)
        //     const signer = await ethers.provider.getSigner(addressImpersonator)
        //     await tokenContract.connect(signer).transfer(distributorAddress,amount)
        //     const balanceContract = await tokenContract.balanceOf(distributorAddress)
        //     const ownerBalance = await tokenContract.balanceOf(owner)
        //     await distributor.withdrawToken(tokenAddress)
        //     const balanceContractAfter = await tokenContract.balanceOf(distributorAddress)
        //     const ownerBalanceAfter = await tokenContract.balanceOf(owner)
        //     expect(balanceContractAfter).to.equal(0)
        //     expect(ownerBalanceAfter).to.be.above(ownerBalance)
        // })
        it("debería retirar AVAX de emergencia del contrato", async function() {
            addressImpersonator = "0xD5AFAcFE7061042695e67210E2C347163683e30c";
            const cantidadAvax = ethers.parseEther("1.0");
            const distributorAddress = await distributor.getAddress()
            await owner.sendTransaction({
                to: distributorAddress,
                value: cantidadAvax
            });
            const balanceInicialContrato = await ethers.provider.getBalance(distributorAddress);
            expect(balanceInicialContrato).to.equal(cantidadAvax);
            const balanceInicialOwner = await ethers.provider.getBalance(owner.address);
            await distributor.emergencyWithdrawAvax();
            const balanceFinalContrato = await ethers.provider.getBalance(distributorAddress);
            const balanceFinalOwner = await ethers.provider.getBalance(owner.address);
            expect(balanceFinalContrato).to.equal(0);
            expect(balanceFinalOwner).to.be.above(balanceInicialOwner);
        })
        it("debería realizar el airdrop", async function () {
            // enviar tokens al contrato
            const distributorAddress = await distributor.getAddress()
            const tokenAddress = "0x4F94b8AEF08c92fEfe416af073F1Df1E284438EC"
            const tokenToTrack = "0x1785d6F5B076d93EfAE079744D0c86F2aC77621f"
            const tokenContract = await ethers.getContractAt("IERC20", tokenAddress);
            addressImpersonator = "0x91e4e6a5eb7823D9933F42B9c67583bb6f622d65";
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [addressImpersonator]
            });
            const amount = ethers.parseUnits("1000006910", 18)
            const signer = await ethers.provider.getSigner(addressImpersonator)
            await tokenContract.connect(signer).transfer(distributorAddress, amount)
            // registrar el token a seguir
            distributor.registerTokenToTrack(tokenToTrack)
            // registrar el token de airdrop
            await distributor.registerAirdropToken(tokenAddress)
            // insertar las direcciones
            const direcciones = await fetchHolders()
            await distributor.registerHolders(direcciones);

            // llamar al airdrop
            const batchSize = 70; // Define el tamaño del lote aquí
            await distributor.setBatchSize(batchSize);
            const balanceBefore = await tokenContract.balanceOf(distributorAddress)
            await distributor.airdrop()
            const balanceAfter = await tokenContract.balanceOf(distributorAddress)
            expect(balanceAfter).to.be.below(balanceBefore);
            let totalHoldersProcessed = 0;
            while (totalHoldersProcessed < direcciones.length) {
                await distributor.airdrop();
                totalHoldersProcessed += batchSize;
            }

            // Verificar que cada dirección tenga más del token de airdrop después del airdrop
            let direccionesSinTokens = 0;
            let direccionesConTokens = 0;
            let direccionesSinTokensList = [];
            for (const direccion of direcciones) {
                const balance = await tokenContract.balanceOf(direccion);
                if (balance === BigInt(0)) {
                    direccionesSinTokens++;
                    direccionesSinTokensList.push(direccion);
                } else {
                    direccionesConTokens++;
                }
            }
            console.log(`Número de direcciones revisadas: ${direcciones.length}`);
            console.log(`Número de direcciones que no recibieron tokens de airdrop: ${direccionesSinTokens}`);
            console.log(`Direcciones que no recibieron tokens de airdrop: ${direccionesSinTokensList.join(', ')}`);
            expect(direccionesSinTokens).to.equal(0, `Hay ${direccionesSinTokens} direcciones de ${direcciones.length} revisadas que no recibieron tokens de airdrop.`);
        })
    })
        // it("should airdrop, change airdrop token and repeat airdrop",async function () {
        //     //primer ciclo
        //     //enviar tokens al contrato
        //     const distributorAddress = await distributor.getAddress()
        //     const tokenAddress= "0x4F94b8AEF08c92fEfe416af073F1Df1E284438EC"
        //     const tokenToTrack = "0x1785d6F5B076d93EfAE079744D0c86F2aC77621f"
        //     const tokenContract = await ethers.getContractAt("IERC20", tokenAddress);
        //     addressImpersonator = "0x91e4e6a5eb7823D9933F42B9c67583bb6f622d65";
        //     await network.provider.request({
        //         method: "hardhat_impersonateAccount",
        //         params: [addressImpersonator]
        //     });
        //     const amount = ethers.parseUnits("1000006910",18)
        //     const signer = await ethers.provider.getSigner(addressImpersonator)
        //     await tokenContract.connect(signer).transfer(distributorAddress,amount)
        //     //registrar el token to track
        //     distributor.registerTokenToTrack(tokenToTrack)
        //     //registrar el token airdrop
        //     await distributor.registerAirdropToken(tokenAddress)
        //     //insertar los addressess
        //     const address1 = "0xB699684651fF748A6357892e006A0BDAa1707D1a";
        //     const address2 = "0xD5AFAcFE7061042695e67210E2C347163683e30c";
        //     const address3 = "0x29fB012F31128eD9C4f4C7a8a7CE01bF6Fc641C4";
        //     const direcciones = [address1, address2, address3];
        //     await distributor.registerHolders(direcciones);
        //     //balances airdrop antes
        //     const balance1Before = await tokenContract.balanceOf(address1)
        //     const balance2Before = await tokenContract.balanceOf(address2)
        //     const balance3Before = await tokenContract.balanceOf(address3)
        //     //llamar airdrop
        //     await distributor.airdrop()
        //     const balance1after = await tokenContract.balanceOf(address1)
        //     const balance2after = await tokenContract.balanceOf(address2)
        //     const balance3after = await tokenContract.balanceOf(address3)
        //     //expect
        //     expect(balance1after).to.be.above(balance1Before);
        //     expect(balance2after).to.be.above(balance2Before);
        //     expect(balance3after).to.be.above(balance3Before);
        //     //segundo ciclo
        //     //reset holders
        //     distributor.resetHolders()
        //     //cambiar airdrop tokens
        //     const newAirdrop = "0x420FcA0121DC28039145009570975747295f2329"
        //     await distributor.registerAirdropToken(newAirdrop)
        //     //ingresar los adresses
        //     await distributor.registerHolders(direcciones);
        //     //transferir tokens al contrato
        //     const coqContract = await ethers.getContractAt("IERC20", newAirdrop);
        //     let addressImpersonatorCoq = "0xA4B237F14627EfD03394d66C3C1bE3878e07AB13";
        //     await network.provider.request({
        //         method: "hardhat_impersonateAccount",
        //         params: [addressImpersonatorCoq]
        //     });
        //     const amountCoq = ethers.parseUnits("343401210",18)
        //     const signer1 = await ethers.provider.getSigner(addressImpersonatorCoq)
        //     await coqContract.connect(signer1).transfer(distributorAddress,amountCoq)
        //     //balances airdrop antes
        //     const balance1BeforeCoq = await coqContract.balanceOf(address1)
        //     const balance2BeforeCoq = await coqContract.balanceOf(address2)
        //     const balance3BeforeCoq = await coqContract.balanceOf(address3)
        //     //llamar airdrop
        //     await distributor.airdrop()
        //     const balance1afterCoq = await coqContract.balanceOf(address1)
        //     const balance2afterCoq = await coqContract.balanceOf(address2)
        //     const balance3afterCoq = await coqContract.balanceOf(address3)
        //     //expect
        //     expect(balance1afterCoq).to.be.above(balance1BeforeCoq);
        //     expect(balance2afterCoq).to.be.above(balance2BeforeCoq);
        //     expect(balance3afterCoq).to.be.above(balance3BeforeCoq);


        //             })
                })




