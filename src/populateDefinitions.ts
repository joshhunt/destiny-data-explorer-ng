import { openDB, IDBPDatabase } from "idb";
import { useEffect, useState } from "react";

interface StoredDefinition {
  tableName: string;
  key: number;
  definition: any;
}

class DefinitionsStore {
  dbVersion = 1;
  dbName = "data-explorer-ng";
  storeName = "definitions";

  ready: Promise<IDBPDatabase<unknown>>;

  constructor() {
    this.ready = openDB(this.dbName, this.dbVersion, {
      upgrade: this.upgradeHandler,
    });
  }

  upgradeHandler = (db: IDBPDatabase<unknown>) => {
    const objectStore = db.createObjectStore(this.storeName, {
      keyPath: ["tableName", "key"],
    });

    objectStore.createIndex("tableName", "tableName");
    objectStore.createIndex("byIndex", ["tableName", "definition.index"]);
    // TODO: store version
  };

  async addDefinitions(tableName: string, definitions: any[]) {
    const tx = (await this.ready).transaction(this.storeName, "readwrite");
    const store = tx.objectStore(this.storeName);

    for (const def of definitions) {
      const storedDef: StoredDefinition = {
        tableName,
        key: def.hash,
        definition: def,
      };

      await store.put(storedDef /*, [storedDef.tableName, storedDef.key]*/);
    }

    await tx.done;
  }

  async getDefinition(tableName: string, hash: number) {
    const def = (await this.ready).get(this.storeName, [tableName, hash]);
    return def;
  }

  async getByIndex(tableName: string, index: number) {
    const tx = (await this.ready).transaction(this.storeName, "readonly");
    const store = tx.objectStore(this.storeName);
    const storeIndex = store.index("byIndex");

    return storeIndex.get([tableName, index]);
  }

  async countForTable(tableName: string) {
    const tx = (await this.ready).transaction(this.storeName, "readonly");
    const store = tx.objectStore(this.storeName);
    const storeIndex = store.index("tableName");
    return storeIndex.count(tableName);
  }
}

const definitionsStore = new DefinitionsStore();

async function init() {
  await definitionsStore.ready;
  console.log("defs store ready");

  const defsCounts: Record<string, number> = {};

  for (const tableName in DEFINITION_URLS) {
    const defPath = DEFINITION_URLS[tableName];

    const storedDefs = await definitionsStore.countForTable(tableName);
    // console.log(storedDefs, tableName);
    defsCounts[tableName] = storedDefs;
    if (storedDefs > 0) continue;

    console.log("Fetching", tableName);

    try {
      const req = await fetch("https://www.bungie.net" + defPath);
      console.log("Parsing", tableName);
      const data = await req.json();
      console.log("Storing", tableName);
      const defs = Object.values(data);
      defsCounts[tableName] = defs.length;
      await definitionsStore.addDefinitions(tableName, defs);
      console.log("Done", tableName);
    } catch (err) {
      console.error(err);
      console.warn("Skipping past that error");
    }
  }

  const counts = Object.entries(defsCounts);

  console.log("Loaded all tables", counts);

  return counts;
}

export function useDefinitions() {
  const [defsCounts, setDefsCounts] = useState<[string, number][]>([]);

  useEffect(() => {
    init()
      .then((v) => setDefsCounts(v))
      .catch((err) => console.error(err));
  }, []);

  return defsCounts;
}

const DEFINITION_URLS: Record<string, string> = {
  // DestinyNodeStepSummaryDefinition:
  //   "/common/destiny2_content/json/en/DestinyNodeStepSummaryDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  // DestinyArtDyeChannelDefinition:
  //   "/common/destiny2_content/json/en/DestinyArtDyeChannelDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  // DestinyArtDyeReferenceDefinition:
  //   "/common/destiny2_content/json/en/DestinyArtDyeReferenceDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyPlaceDefinition:
    "/common/destiny2_content/json/en/DestinyPlaceDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  // DestinyActivityDefinition:
  //   "/common/destiny2_content/json/en/DestinyActivityDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyActivityTypeDefinition:
    "/common/destiny2_content/json/en/DestinyActivityTypeDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyClassDefinition:
    "/common/destiny2_content/json/en/DestinyClassDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyGenderDefinition:
    "/common/destiny2_content/json/en/DestinyGenderDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyInventoryBucketDefinition:
    "/common/destiny2_content/json/en/DestinyInventoryBucketDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyRaceDefinition:
    "/common/destiny2_content/json/en/DestinyRaceDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyTalentGridDefinition:
    "/common/destiny2_content/json/en/DestinyTalentGridDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  // DestinyUnlockDefinition:
  //   "/common/destiny2_content/json/en/DestinyUnlockDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinySandboxPerkDefinition:
    "/common/destiny2_content/json/en/DestinySandboxPerkDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyStatGroupDefinition:
    "/common/destiny2_content/json/en/DestinyStatGroupDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyProgressionMappingDefinition:
    "/common/destiny2_content/json/en/DestinyProgressionMappingDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyFactionDefinition:
    "/common/destiny2_content/json/en/DestinyFactionDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyVendorGroupDefinition:
    "/common/destiny2_content/json/en/DestinyVendorGroupDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  // DestinyUnlockValueDefinition:
  //   "/common/destiny2_content/json/en/DestinyUnlockValueDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  // DestinyRewardMappingDefinition:
  //   "/common/destiny2_content/json/en/DestinyRewardMappingDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  // DestinyRewardSheetDefinition:
  //   "/common/destiny2_content/json/en/DestinyRewardSheetDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyItemCategoryDefinition:
    "/common/destiny2_content/json/en/DestinyItemCategoryDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyDamageTypeDefinition:
    "/common/destiny2_content/json/en/DestinyDamageTypeDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyActivityModeDefinition:
    "/common/destiny2_content/json/en/DestinyActivityModeDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyMedalTierDefinition:
    "/common/destiny2_content/json/en/DestinyMedalTierDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyAchievementDefinition:
    "/common/destiny2_content/json/en/DestinyAchievementDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyActivityGraphDefinition:
    "/common/destiny2_content/json/en/DestinyActivityGraphDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyActivityInteractableDefinition:
    "/common/destiny2_content/json/en/DestinyActivityInteractableDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyBondDefinition:
    "/common/destiny2_content/json/en/DestinyBondDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyCharacterCustomizationCategoryDefinition:
    "/common/destiny2_content/json/en/DestinyCharacterCustomizationCategoryDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyCharacterCustomizationOptionDefinition:
    "/common/destiny2_content/json/en/DestinyCharacterCustomizationOptionDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyCollectibleDefinition:
    "/common/destiny2_content/json/en/DestinyCollectibleDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyDestinationDefinition:
    "/common/destiny2_content/json/en/DestinyDestinationDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyEntitlementOfferDefinition:
    "/common/destiny2_content/json/en/DestinyEntitlementOfferDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyEquipmentSlotDefinition:
    "/common/destiny2_content/json/en/DestinyEquipmentSlotDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyEventCardDefinition:
    "/common/destiny2_content/json/en/DestinyEventCardDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyStatDefinition:
    "/common/destiny2_content/json/en/DestinyStatDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyInventoryItemDefinition:
    "/common/destiny2_content/json/en/DestinyInventoryItemDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyItemTierTypeDefinition:
    "/common/destiny2_content/json/en/DestinyItemTierTypeDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyLoadoutColorDefinition:
    "/common/destiny2_content/json/en/DestinyLoadoutColorDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyLoadoutIconDefinition:
    "/common/destiny2_content/json/en/DestinyLoadoutIconDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyLoadoutNameDefinition:
    "/common/destiny2_content/json/en/DestinyLoadoutNameDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyLocationDefinition:
    "/common/destiny2_content/json/en/DestinyLocationDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyLoreDefinition:
    "/common/destiny2_content/json/en/DestinyLoreDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyMaterialRequirementSetDefinition:
    "/common/destiny2_content/json/en/DestinyMaterialRequirementSetDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyMetricDefinition:
    "/common/destiny2_content/json/en/DestinyMetricDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyObjectiveDefinition:
    "/common/destiny2_content/json/en/DestinyObjectiveDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyPlatformBucketMappingDefinition:
    "/common/destiny2_content/json/en/DestinyPlatformBucketMappingDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyPlugSetDefinition:
    "/common/destiny2_content/json/en/DestinyPlugSetDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyPowerCapDefinition:
    "/common/destiny2_content/json/en/DestinyPowerCapDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyPresentationNodeDefinition:
    "/common/destiny2_content/json/en/DestinyPresentationNodeDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyProgressionDefinition:
    "/common/destiny2_content/json/en/DestinyProgressionDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyProgressionLevelRequirementDefinition:
    "/common/destiny2_content/json/en/DestinyProgressionLevelRequirementDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyRecordDefinition:
    "/common/destiny2_content/json/en/DestinyRecordDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyRewardAdjusterPointerDefinition:
    "/common/destiny2_content/json/en/DestinyRewardAdjusterPointerDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyRewardAdjusterProgressionMapDefinition:
    "/common/destiny2_content/json/en/DestinyRewardAdjusterProgressionMapDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyRewardItemListDefinition:
    "/common/destiny2_content/json/en/DestinyRewardItemListDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinySackRewardItemListDefinition:
    "/common/destiny2_content/json/en/DestinySackRewardItemListDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinySandboxPatternDefinition:
    "/common/destiny2_content/json/en/DestinySandboxPatternDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinySeasonDefinition:
    "/common/destiny2_content/json/en/DestinySeasonDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinySeasonPassDefinition:
    "/common/destiny2_content/json/en/DestinySeasonPassDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinySocialCommendationDefinition:
    "/common/destiny2_content/json/en/DestinySocialCommendationDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinySocketCategoryDefinition:
    "/common/destiny2_content/json/en/DestinySocketCategoryDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinySocketTypeDefinition:
    "/common/destiny2_content/json/en/DestinySocketTypeDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyTraitDefinition:
    "/common/destiny2_content/json/en/DestinyTraitDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  // DestinyUnlockCountMappingDefinition:
  //   "/common/destiny2_content/json/en/DestinyUnlockCountMappingDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  // DestinyUnlockEventDefinition:
  //   "/common/destiny2_content/json/en/DestinyUnlockEventDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  // DestinyUnlockExpressionMappingDefinition:
  //   "/common/destiny2_content/json/en/DestinyUnlockExpressionMappingDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyVendorDefinition:
    "/common/destiny2_content/json/en/DestinyVendorDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyMilestoneDefinition:
    "/common/destiny2_content/json/en/DestinyMilestoneDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyActivityModifierDefinition:
    "/common/destiny2_content/json/en/DestinyActivityModifierDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyReportReasonCategoryDefinition:
    "/common/destiny2_content/json/en/DestinyReportReasonCategoryDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyArtifactDefinition:
    "/common/destiny2_content/json/en/DestinyArtifactDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyBreakerTypeDefinition:
    "/common/destiny2_content/json/en/DestinyBreakerTypeDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyChecklistDefinition:
    "/common/destiny2_content/json/en/DestinyChecklistDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyEnergyTypeDefinition:
    "/common/destiny2_content/json/en/DestinyEnergyTypeDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinySocialCommendationNodeDefinition:
    "/common/destiny2_content/json/en/DestinySocialCommendationNodeDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyGuardianRankDefinition:
    "/common/destiny2_content/json/en/DestinyGuardianRankDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyGuardianRankConstantsDefinition:
    "/common/destiny2_content/json/en/DestinyGuardianRankConstantsDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
  DestinyLoadoutConstantsDefinition:
    "/common/destiny2_content/json/en/DestinyLoadoutConstantsDefinition-88e2ca87-7551-4503-a5b5-2527c4531503.json",
};

export function useDefinition(tableName: string, index: number) {
  const [def, setDef] = useState<[any, boolean]>([undefined, false]);

  useEffect(() => {
    if (index === -1) return;

    async function run() {
      try {
        const defResult = await definitionsStore.getByIndex(tableName, index);
        setDef([defResult.definition, true]);
      } catch {
        setDef([undefined, true]);
      }
    }

    run();
  }, [tableName, index]);

  return def;
}
