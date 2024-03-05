import { Permission, PermissionSet } from "zodiac-roles-sdk"
import { BigNumberish, Contract, Overrides } from "ethers"
import { Interface, parseEther } from "ethers/lib/utils"

import { avatar, owner, member } from "./wallets"
import { getProvider } from "./provider"
import { createApply } from "../src/apply"
import { getRolesMod, testRoleKey } from "./rolesMod"

export const applyPermissions = async (
  permissions: (Permission | PermissionSet | Promise<PermissionSet>)[]
) => {
  const apply = createApply(1) // chainId here won't matter (since we pass currentTargets and currentAnnotations no subgraph queries will be made)
  const calls = await apply(testRoleKey, permissions, {
    address: getRolesMod().address as `0x${string}`,
    mode: "replace",
    log: console.debug,
    currentTargets: [],
    currentAnnotations: [],
  })

  console.log(`Applying permissions with ${calls.length} calls`)
  let nonce = await owner.getTransactionCount()

  await Promise.all(
    calls.map(async (call, i) => {
      try {
        return await owner.sendTransaction({
          ...call,
          nonce: nonce++,
        })
      } catch (e: any) {
        console.error(`Error applying permissions in call #${i}:`, call)
        if (e.error?.error?.data) {
          const iface = new Interface([
            {
              inputs: [],
              name: "NotBFS",
              type: "error",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "index",
                  type: "uint256",
                },
              ],
              name: "UnsuitableChildCount",
              type: "error",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "index",
                  type: "uint256",
                },
              ],
              name: "UnsuitableChildTypeTree",
              type: "error",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "index",
                  type: "uint256",
                },
              ],
              name: "UnsuitableCompValue",
              type: "error",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "index",
                  type: "uint256",
                },
              ],
              name: "UnsuitableParameterType",
              type: "error",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "index",
                  type: "uint256",
                },
              ],
              name: "UnsuitableParent",
              type: "error",
            },
            {
              inputs: [],
              name: "UnsuitableRootNode",
              type: "error",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "index",
                  type: "uint256",
                },
              ],
              name: "UnsupportedOperator",
              type: "error",
            },
            {
              inputs: [
                {
                  components: [
                    {
                      internalType: "uint8",
                      name: "parent",
                      type: "uint8",
                    },
                    {
                      internalType: "enum ParameterType",
                      name: "paramType",
                      type: "ParameterType",
                    },
                    {
                      internalType: "enum Operator",
                      name: "operator",
                      type: "Operator",
                    },
                    {
                      internalType: "bytes",
                      name: "compValue",
                      type: "bytes",
                    },
                  ],
                  internalType: "struct ConditionFlat[]",
                  name: "conditions",
                  type: "tuple[]",
                },
              ],
              name: "enforce",
              outputs: [],
              stateMutability: "pure",
              type: "function",
            },
          ])
          const error = iface.getError(e.error.error.data.slice(0, 10))
          if (error) {
            console.error(
              "Integrity check failed with:",
              error.name,
              iface.decodeErrorResult(error, e.error.error.data)
            )
            throw new Error(`Integrity check failed with: ${error.name}`)
          }
        }
        throw e
      }
    })
  )

  console.log("Permissions applied")
}

export const execThroughRole = async (
  {
    to,
    data,
    value,
    operation = 0,
  }: {
    to: `0x${string}`
    data?: `0x${string}`
    value?: `0x${string}`
    operation?: 0 | 1
  },
  overrides?: Overrides
) =>
  await getRolesMod()
    .connect(member)
    .execTransactionWithRole(
      to,
      value || 0,
      data || "0x",
      operation,
      testRoleKey,
      true,
      overrides
    )

export const callThroughRole = async ({
  to,
  data,
  value,
  operation = 0,
}: {
  to: `0x${string}`
  data?: `0x${string}`
  value?: `0x${string}`
  operation?: 0 | 1
}) =>
  await getRolesMod()
    .connect(member)
    .callStatic.execTransactionWithRole(
      to,
      value || 0,
      data || "0x",
      operation,
      testRoleKey,
      false
    )

const erc20Interface = new Interface([
  "function transfer(address to, uint amount) returns (bool)",
])

export const stealErc20 = async (
  token: `0x${string}`,
  amount: BigNumberish,
  from: `0x${string}`
) => {
  const provider = getProvider()

  // Get the token contract with impersonated signer
  const contract = new Contract(
    token,
    erc20Interface,
    await provider.getSigner(from)
  )

  // Impersonate the token holder and give a little gas stipend
  await provider.send("anvil_impersonateAccount", [from])
  await provider.send("anvil_setBalance", [from, parseEther("1").toHexString()])

  // Transfer the requested amount to the avatar
  await contract.transfer(await avatar.getAddress(), amount)

  // Stop impersonating
  await provider.send("anvil_stopImpersonatingAccount", [from])
}

export async function advanceTime(seconds: number) {
  const provider = getProvider()
  await provider.send("evm_increaseTime", [seconds])
  await provider.send("evm_mine", [])
}
