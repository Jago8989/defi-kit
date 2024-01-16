import { eth } from "."
import { applyPermissions, stealErc20 } from "../../../test/helpers"
import { testKit } from "../../../test/kit"
import { parseEther } from "ethers/lib/utils"

const B_rETH_STABLE = "0x1E19CF2D73a72Ef1332C882F20534B6519Be0276"
const B_rETH_STABLE_gauge = "0x79eF6103A513951a3b25743DB509E267685726B7"

describe("balancer", () => {
  describe("stake", () => {
    beforeAll(async () => {
      await applyPermissions(await eth.stake({ targets: ["B-rETH-STABLE"] }))
    })

    it("stake and withdraw from gauge", async () => {
      await stealErc20(
        B_rETH_STABLE,
        parseEther("1"),
        B_rETH_STABLE_gauge
      )
      await expect(
        testKit.eth.usdc
          .attach(B_rETH_STABLE)
          .approve(B_rETH_STABLE_gauge, parseEther("1"))
      ).not.toRevert()

      await expect(
        testKit.eth.balancer.gauge.attach(B_rETH_STABLE_gauge)["deposit(uint256)"](
          parseEther("1")
        )
      ).not.toRevert()

      await expect(
        testKit.eth.balancer.gauge.attach(B_rETH_STABLE_gauge)["withdraw(uint256)"](
          parseEther("1")
        )
      ).not.toRevert()

      await expect(
        testKit.eth.balancer.gauge.attach(B_rETH_STABLE_gauge)["claim_rewards()"]()
      ).not.toRevert()

      await expect(
        testKit.eth.balancer.minter.mint(
          B_rETH_STABLE_gauge
        )
      ).not.toRevert()
    }, 30000) // Added 30 seconds of timeout because the deposit takes too long and the test fails.
  })
})