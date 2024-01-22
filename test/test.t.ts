import {expect} from "chai"
import {ethers,network} from "hardhat"
import { NewDistributor__factory } from "../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"

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
            const address1 = "0xB699684651fF748A6357892e006A0BDAa1707D1a";
            const address2 = "0xD5AFAcFE7061042695e67210E2C347163683e30c";
            const address3 = "0x29fB012F31128eD9C4f4C7a8a7CE01bF6Fc641C4";
            const direcciones = [address1, address2, address3];
            await distributor.registerHolders(direcciones);
            for (const direccion of direcciones) {
                expect(await distributor.isHolder(direccion)).to.be.true;
            }
        });
    })



})
