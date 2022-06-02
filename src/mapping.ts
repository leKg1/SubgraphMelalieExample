import { BigInt } from "@graphprotocol/graph-ts"
import {
  Melalie,
  Approval,
  OwnershipTransferred,
  Paused,
  RewardWithdrawn,
  RewardsDistributed,
  StakeCreated,
  StakeRemoved,
  Transfer,
  Unpaused
} from "../generated/Melalie/Melalie"
import { StakePerDay, StakePerHour, RewardsDistributedEntity } from "../generated/schema"

export function findAndUpdateMissingDays(dayId: i32): void {

    //1. loop backwards and find the last day with data
    const firstDayId = 1627537119 / 86400; //is calculated by the timestamp of the contract creation  
    let currentDayId = dayId;
    let foundLastDayWithData =  0;
    let foundLastData = BigInt.fromI32(0)
    while(true){
      currentDayId--;
      let currentStakePerDay = StakePerDay.load(BigInt.fromI32(currentDayId).toString());
      if(currentStakePerDay === null){
        currentStakePerDay = new StakePerDay(BigInt.fromI32(currentDayId).toString())
        currentStakePerDay.totalStake =  BigInt.fromI32(0);
        currentStakePerDay.save(); //maybe this? usually not here - what you mean usually? are we doing anything usual ritht now? 
      // i mean here we initialize, yes but if we don't save, then it cannot be found later. i would save at end. this is the end of the first loop, ok, let's try this
      }
      if(currentStakePerDay.totalStake !== null){ //we found the last day with data
        foundLastDayWithData = currentDayId;
        foundLastData = currentStakePerDay.totalStake;
      }
      if(currentDayId<firstDayId) break;        
    }
    //2. loop forward from the last day with data until current dayId and set those data with the last data 
    for(let d = foundLastDayWithData;d<currentDayId;d++){
      let currentStakePerDay = StakePerDay.load(BigInt.fromI32(d).toString());
      
      if(currentStakePerDay === null){
        currentStakePerDay = new StakePerDay(BigInt.fromI32(d).toString())
        currentStakePerDay.totalStake =  BigInt.fromI32(0);
      }
  
      currentStakePerDay.totalStake = foundLastData
      currentStakePerDay.save();
    }   
}

export function handleStakeCreated(event: StakeCreated): void {
  let melalie = Melalie.bind(event.address)
  const timestamp = event.block.timestamp.toI32();
  const dayId = timestamp / 86400;
  const hourId = timestamp / 3600;

  // Stakes per day
  let stakePerDay = StakePerDay.load(BigInt.fromI32(dayId).toString());
  if(stakePerDay === null){
      stakePerDay = new StakePerDay(BigInt.fromI32(dayId).toString());
      stakePerDay.stakeCreatedCount = BigInt.fromI32(0);
      stakePerDay.stakeCreatedSum =  BigInt.fromI32(0);
      stakePerDay.stakeRemovedCount = BigInt.fromI32(0);
      stakePerDay.stakeRemovedSum =  BigInt.fromI32(0);
      stakePerDay.totalStake =  BigInt.fromI32(0);
  }

  stakePerDay.stakeCreatedSum = stakePerDay.stakeCreatedSum.plus(event.params._stake);
  stakePerDay.stakeCreatedCount = stakePerDay.stakeCreatedCount.plus(BigInt.fromI32(1));
  
  findAndUpdateMissingDays(dayId)   
  
  stakePerDay.totalStake = melalie.totalStakes();
  stakePerDay.save();

  // Stakes per hour
  let stakePerHour = StakePerHour.load(BigInt.fromI32(hourId).toString());
  if(stakePerHour === null){
      stakePerHour = new StakePerHour(BigInt.fromI32(hourId).toString());
      stakePerHour = new StakePerHour(" ");
      stakePerHour.stakeCreatedCount = BigInt.fromI32(0);
      stakePerHour.stakeCreatedSum =  BigInt.fromI32(0);
      stakePerHour.stakeRemovedCount = BigInt.fromI32(0);
      stakePerHour.stakeRemovedSum =  BigInt.fromI32(0);
  }
  stakePerHour.stakeCreatedSum = stakePerHour.stakeCreatedSum.plus(event.params._stake);
  stakePerHour.stakeCreatedCount = stakePerHour.stakeCreatedCount.plus(BigInt.fromI32(1));
  stakePerHour.save();

}

export function handleStakeRemoved(event: StakeRemoved): void {
  let melalie = Melalie.bind(event.address)
  const timestamp = event.block.timestamp.toI32();
  const dayId = timestamp / 86400;
  const hourId = timestamp / 3600;
4
  let stakeRemovedPerDay = StakePerDay.load(BigInt.fromI32(dayId).toString());
  if(stakeRemovedPerDay === null){
      stakeRemovedPerDay = new StakePerDay(BigInt.fromI32(dayId).toString());
      stakeRemovedPerDay.stakeRemovedCount = BigInt.fromI32(0);
      stakeRemovedPerDay.stakeRemovedSum =  BigInt.fromI32(0);
      stakeRemovedPerDay.stakeCreatedCount = BigInt.fromI32(0);
      stakeRemovedPerDay.stakeCreatedSum =  BigInt.fromI32(0);
      stakeRemovedPerDay.totalStake =  BigInt.fromI32(0);
  }
  stakeRemovedPerDay.stakeRemovedSum = stakeRemovedPerDay.stakeRemovedSum.plus(event.params._stake);
  stakeRemovedPerDay.stakeRemovedCount = stakeRemovedPerDay.stakeRemovedCount.plus(BigInt.fromI32(1));
  findAndUpdateMissingDays(dayId)  
  stakeRemovedPerDay.totalStake = melalie.totalStakes();
  stakeRemovedPerDay.save();

  let stakeRemovedPerHour = StakePerHour.load(BigInt.fromI32(hourId).toString());
  if(stakeRemovedPerHour === null){
    stakeRemovedPerHour = new StakePerHour(BigInt.fromI32(hourId).toString());
    stakeRemovedPerHour.stakeRemovedCount = BigInt.fromI32(0);
    stakeRemovedPerHour.stakeRemovedSum =  BigInt.fromI32(0);
    stakeRemovedPerHour.stakeCreatedCount = BigInt.fromI32(0);
    stakeRemovedPerHour.stakeCreatedSum =  BigInt.fromI32(0);
  }
  stakeRemovedPerHour.stakeRemovedSum = stakeRemovedPerHour.stakeRemovedSum.plus(event.params._stake);
  stakeRemovedPerHour.stakeRemovedCount = stakeRemovedPerHour.stakeRemovedCount.plus(BigInt.fromI32(1));
  stakeRemovedPerHour.save();
}

// export function handleRewardsDistributed(event: RewardsDistributed): void {
//   let melalie = Melalie.bind(event.address)
//   const timestamp = event.block.timestamp.toI32();
//   const dayId = timestamp / 86400;
//   const hourId = timestamp / 3600;

//   let rewardsDistributed = RewardsDistributedEntity.load(BigInt.fromI32(dayId).toString());
//   if(rewardsDistributed === null){
//       rewardsDistributed = new RewardsDistributedEntity(BigInt.fromI32(dayId).toString());
//       rewardsDistributed.totalRewards = BigInt.fromI32(0);
//       rewardsDistributed.totalDistributions =  BigInt.fromI32(0);
//   }

//   rewardsDistributed._distributionAmount = event.params._distributionAmount
//   rewardsDistributed.totalRewards = melalie.totalRewards();
//   rewardsDistributed.totalDistributions = melalie.totalDistributions();
//   rewardsDistributed.save();
// }

export function handleApproval(event: Approval): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handlePaused(event: Paused): void {}

export function handleRewardWithdrawn(event: RewardWithdrawn): void {}

export function handleTransfer(event: Transfer): void {}

export function handleUnpaused(event: Unpaused): void {}
