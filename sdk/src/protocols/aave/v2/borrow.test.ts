import { eth } from "."
import { avatar, member } from "../../../../test/wallets"
import { applyPermissions } from "../../../../test/helpers"
import { contracts } from "../../../../eth-sdk/config"
import { Status } from "../../../../test/types"
import { testKit } from "../../../../test/kit"

const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"

describe("aave_v2", () => {
  describe("borrow", () => {
    beforeAll(async () => {
      await applyPermissions(await eth.borrow({ tokens: ["ETH", "USDC"] }))
    })

    // Test with ETH
    it("allows borrowing ETH from avatar", async () => {
      await expect(
        testKit.eth.aaveV2.variableDebtWETH.approveDelegation(
          contracts.mainnet.aaveV2.wrappedTokenGatewayV2,
          1000
        )
      ).not.toRevert()

      await expect(
        testKit.eth.aaveV2.wrappedTokenGatewayV2.borrowETH(
          contracts.mainnet.aaveV2.aaveLendingPoolV2,
          1000,
          2,
          0
        )
      ).not.toRevert()
    })

    it("only allows repaying ETH from avatar", async () => {
      await expect(
        testKit.eth.aaveV2.wrappedTokenGatewayV2.repayETH(
          contracts.mainnet.aaveV2.aaveLendingPoolV2,
          1000,
          2,
          avatar._address
        )
      ).not.toRevert()

      const anotherAddress = member._address
      await expect(
        testKit.eth.aaveV2.wrappedTokenGatewayV2.repayETH(
          contracts.mainnet.aaveV2.aaveLendingPoolV2,
          1000,
          2,
          anotherAddress
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("allows swapping the ETH borrow rate mode", async () => {
      await expect(
        testKit.eth.aaveV2.aaveLendingPoolV2.swapBorrowRateMode(WETH, 1)
      ).not.toRevert()
    })

    // Test with USDC
    it("only allows borrowing USDC from avatar", async () => {
      await expect(
        testKit.eth.aaveV2.aaveLendingPoolV2.borrow(
          USDC,
          1000,
          2,
          0,
          avatar._address
        )
      ).not.toRevert()

      const anotherAddress = member._address
      await expect(
        testKit.eth.aaveV2.aaveLendingPoolV2.borrow(
          USDC,
          1000,
          2,
          0,
          anotherAddress
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("only allows repaying USDC from avatar", async () => {
      await expect(
        testKit.eth.aaveV2.aaveLendingPoolV2.repay(
          USDC,
          1000,
          2,
          avatar._address
        )
      ).not.toRevert()

      const anotherAddress = member._address
      await expect(
        testKit.eth.aaveV2.aaveLendingPoolV2.repay(
          USDC,
          1000,
          2,
          anotherAddress
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("allows swapping the USDC borrow rate mode", async () => {
      await expect(
        testKit.eth.aaveV2.aaveLendingPoolV2.swapBorrowRateMode(USDC, 1)
      ).not.toRevert()
    })
  })
})
