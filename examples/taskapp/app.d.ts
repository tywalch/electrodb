export declare namespace employeesEntity {
    namespace WhereClause {
        const employeeSymbol: unique symbol;

        const firstNameSymbol: unique symbol;

        const lastNameSymbol: unique symbol;

        const officeSymbol: unique symbol;

        const titleSymbol: unique symbol;

        const teamSymbol: unique symbol;

        const salarySymbol: unique symbol;

        const managerSymbol: unique symbol;

        const dateHiredSymbol: unique symbol;

        const birthdaySymbol: unique symbol;

        interface employee {
            [employeeSymbol]: void;
        }

        interface firstName {
            [firstNameSymbol]: void;
        }

        interface lastName {
            [lastNameSymbol]: void;
        }

        interface office {
            [officeSymbol]: void;
        }

        interface title {
            [titleSymbol]: void;
        }

        interface team {
            [teamSymbol]: void;
        }

        interface salary {
            [salarySymbol]: void;
        }

        interface manager {
            [managerSymbol]: void;
        }

        interface dateHired {
            [dateHiredSymbol]: void;
        }

        interface birthday {
            [birthdaySymbol]: void;
        }

        export type AttributeName = employee | firstName | lastName | office | title | team | salary | manager | dateHired | birthday

        export type AttributeType<T extends AttributeName> =
            T extends employee ? string :
            T extends firstName ? string :
            T extends lastName ? string :
            T extends office ? string :
            T extends title ? string :
            T extends team ? teamEnum :
            T extends salary ? string :
            T extends manager ? string :
            T extends dateHired ? string :
            T extends birthday ? string :
            never;

        export type Operations = {
            eq: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            gt: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            lt: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            gte: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            lte: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            between: <T extends AttributeName>(attr: T, value: AttributeType<T>, value2: AttributeType<T>) => string,
            begins: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            exists: <T extends AttributeName>(attr: T) => string,
            notExists: <T extends AttributeName>(attr: T) => string,
            contains: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            notContains: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            value: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            name: <T extends AttributeName>(attr: T) => string,
        };

        type Attributes = {
            employee: employee;
            firstName: firstName;
            lastName: lastName;
            office: office;
            title: title;
            team: team;
            salary: salary;
            manager: manager;
            dateHired: dateHired;
            birthday: birthday;
        }

        type Callback = (attr: Attributes, op: Operations) => string;
    }

    type teamEnum = "development" | "marketing" | "finance" | "product" | "cool cats and kittens";

    type TableIndexNames = "pk" | "sk";

    export type Item = {
        employee?: string
        firstName: string
        lastName: string
        office: string
        title: string
        team: teamEnum
        salary: string
        manager?: string
        dateHired?: string
        birthday?: string
    }

    export type Attributes = {
        employee: string
        firstName: string
        lastName: string
        office: string
        title: string
        team: teamEnum
        salary: string
        manager: string
        dateHired: string
        birthday: string
    }

    export type RawItem = {
        sk: string
        pk: string
        gsi1sk: string
        gsi1pk: string
        gsi2sk: string
        gsi2pk: string
        gsi3sk: string
        gsi3pk: string
        gsi4sk: string
        gsi4pk: string
        gsi5sk: string
        gsi5pk: string
        employee?: string
        firstName: string
        lastName: string
        office: string
        title: string
        team: teamEnum
        salary: string
        manager?: string
        dateHired?: string
        birthday?: string
    }

    type config = {
        raw?: boolean,
        params?: Object,
        includeKeys?: boolean,
        originalErr?: boolean,
    }

    type NonReadOnlyProperties = {
        firstName: string
        lastName: string
        office: string
        title: string
        team: teamEnum
        salary: string
        manager?: string
        dateHired?: string
        birthday?: string
    }

    type employeeIndex = { employee: string }

    type coworkersIndex = { office: string } | { office: string, team: teamEnum } | { office: string, team: teamEnum, title: string } | { office: string, team: teamEnum, title: string, employee: string }

    type coworkersIndexPK = {}

    type coworkersIndexSK = { office: string } | { office: string, team: teamEnum } | { office: string, team: teamEnum, title: string } | { office: string, team: teamEnum, title: string, employee: string }

    type teamsIndex = { team: teamEnum } | { team: teamEnum, dateHired: string } | { team: teamEnum, dateHired: string, title: string }

    type teamsIndexPK = {}

    type teamsIndexSK = { team: teamEnum } | { team: teamEnum, dateHired: string } | { team: teamEnum, dateHired: string, title: string }

    type employeeLookupIndex = { employee: string }

    type employeeLookupIndexPK = {}

    type employeeLookupIndexSK = { employee: string }

    type rolesIndex = { title: string } | { title: string, salary: string }

    type rolesIndexPK = {}

    type rolesIndexSK = { title: string } | { title: string, salary: string }

    type directReportsIndex = { manager: string } | { manager: string, team: teamEnum } | { manager: string, team: teamEnum, office: string }

    type directReportsIndexPK = {}

    type directReportsIndexSK = { manager: string } | { manager: string, team: teamEnum } | { manager: string, team: teamEnum, office: string }

    // Figure out better typing for value here
    type FilterOperations<T> = {
        gte: (value: T) => string
        gt: (value: T) => string
        lte: (value: T) => string
        lt: (value: T) => string
        eq: (value: T) => string
        begins: (value: T) => string
        exists: () => T
        notExists: () => T
        contains: (value: T) => string
        notContains: (value: T) => string
        between: (start: T, end: T) => string
        name: () => T
        value: (value: T) => string
    };

    type FilterAttributes<T extends Attributes> = {
        [K in keyof T]: FilterOperations<T[K]>
    }

    type GoRecord<T> = () => Promise<T>

    type PageRecord = (page?: employeeIndex | null) => Promise<[Item | null, Item[]]>

    type ParamRecord = () => Object

    type FilterRecords = (filter: <T extends Attributes>(record: FilterAttributes<T>) => string) => RecordsActionOptions

    type WhereRecords = (where: WhereClause.Callback) => RecordsActionOptions

    type RecordsActionOptions = {
        go: GoRecord<Item[]>
        params: ParamRecord
        page: PageRecord
        filter: FilterRecords
        where: WhereRecords
    }

    type SetRecordActionOptions = {
        go: GoRecord<Item[]>
        params: ParamRecord
        filter: FilterRecords
        page: PageRecord
        set: SetRecord
        where: WhereRecords
    }

    type SetRecord = (properties: Partial<NonReadOnlyProperties>) => SetRecordActionOptions

    type QueryOperations<T> = {
        between: (skFacetsStart: T, skFacetsEnd: T) => RecordsActionOptions
        gt: (skFacets: T) => RecordsActionOptions
        gte: (skFacets: T) => RecordsActionOptions
        lt: (skFacets: T) => RecordsActionOptions
        lte: (skFacets: T) => RecordsActionOptions
        go: GoRecord<Item[]>
        params: ParamRecord
        page: PageRecord
        filter: FilterRecords
        where: WhereRecords
    }

    export class employees {
        get: (key: employeeIndex) => {go: GoRecord<Item>};
        delete: ((key: employeeIndex) => {go: GoRecord<Item>}) | ((key: employeeIndex[]) => {go: GoRecord<Item[]>});
        update: (key: employeeIndex) => {set: SetRecord};
        patch: (key: employeeIndex) => {set: SetRecord};
        put: ((record: Item) => {go: GoRecord<Item>}) | ((record: Item[]) => {go: GoRecord<Item[]>});
        create: (record: Item) => {go: GoRecord<Item>};
        find: (record: Partial<Item>) => RecordsActionOptions;
        setIdentifier: (type: "model" | "table", value: string) => void
        query: {
            employee: (key: employeeIndex) => RecordsActionOptions,
            coworkers: (key: coworkersIndex) => QueryOperations<coworkersIndexSK>
            teams: (key: teamsIndex) => QueryOperations<teamsIndexSK>
            employeeLookup: (key: employeeLookupIndex) => QueryOperations<employeeLookupIndexSK>
            roles: (key: rolesIndex) => QueryOperations<rolesIndexSK>
            directReports: (key: directReportsIndex) => QueryOperations<directReportsIndexSK>
        };
        model: {"modelVersion":"v1","service":"taskapp","version":"1","entity":"employees","table":"electro","schema":{"attributes":{"employee":{"name":"employee","field":"employee","readOnly":true,"required":false,"indexes":[{"index":"","name":"employee","type":"pk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":""}],"type":"string","enumArray":[]},"firstName":{"name":"firstName","field":"firstName","readOnly":false,"required":true,"indexes":[],"type":"string","enumArray":[]},"lastName":{"name":"lastName","field":"lastName","readOnly":false,"required":true,"indexes":[],"type":"string","enumArray":[]},"office":{"name":"office","field":"office","readOnly":false,"required":true,"indexes":[{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":"team"},{"index":"gsi5pk-gsi5sk-index","name":"office","type":"sk","next":""}],"type":"string","enumArray":[]},"title":{"name":"title","field":"title","readOnly":false,"required":true,"indexes":[{"index":"gsi1pk-gsi1sk-index","name":"title","type":"sk","next":"employee"},{"index":"gsi2pk-gsi2sk-index","name":"title","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"title","type":"pk","next":"salary"}],"type":"string","enumArray":[]},"team":{"name":"team","field":"team","readOnly":false,"required":true,"indexes":[{"index":"gsi1pk-gsi1sk-index","name":"team","type":"sk","next":"title"},{"index":"gsi2pk-gsi2sk-index","name":"team","type":"pk","next":"dateHired"},{"index":"gsi5pk-gsi5sk-index","name":"team","type":"sk","next":"office"}],"type":"enum","enumArray":["development","marketing","finance","product","cool cats and kittens"]},"salary":{"name":"salary","field":"salary","readOnly":false,"required":true,"indexes":[{"index":"gsi4pk-gsi4sk-index","name":"salary","type":"sk","next":""}],"type":"string","enumArray":[]},"manager":{"name":"manager","field":"manager","readOnly":false,"required":false,"indexes":[{"index":"gsi5pk-gsi5sk-index","name":"manager","type":"pk","next":"team"}],"type":"string","enumArray":[]},"dateHired":{"name":"dateHired","field":"dateHired","readOnly":false,"required":false,"indexes":[{"index":"gsi2pk-gsi2sk-index","name":"dateHired","type":"sk","next":"title"}],"type":"string","enumArray":[]},"birthday":{"name":"birthday","field":"birthday","readOnly":false,"required":false,"indexes":[],"type":"string","enumArray":[]}},"enums":{},"translationForTable":{"employee":"employee","firstName":"firstName","lastName":"lastName","office":"office","title":"title","team":"team","salary":"salary","manager":"manager","dateHired":"dateHired","birthday":"birthday"},"translationForRetrieval":{"employee":"employee","firstName":"firstName","lastName":"lastName","office":"office","title":"title","team":"team","salary":"salary","manager":"manager","dateHired":"dateHired","birthday":"birthday"}},"facets":{"byIndex":{"":{"customFacets":{"pk":false,"sk":false},"pk":["employee"],"sk":[],"all":[{"name":"employee","index":"","type":"sk"}]},"gsi1pk-gsi1sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["office"],"sk":["team","title","employee"],"all":[{"name":"office","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"team","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"title","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"employee","index":"gsi1pk-gsi1sk-index","type":"sk"}],"collection":"workplaces"},"gsi2pk-gsi2sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["team"],"sk":["dateHired","title"],"all":[{"name":"team","index":"gsi2pk-gsi2sk-index","type":"sk"},{"name":"dateHired","index":"gsi2pk-gsi2sk-index","type":"sk"},{"name":"title","index":"gsi2pk-gsi2sk-index","type":"sk"}]},"gsi3pk-gsi3sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["employee"],"sk":[],"all":[{"name":"employee","index":"gsi3pk-gsi3sk-index","type":"sk"}],"collection":"assignments"},"gsi4pk-gsi4sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["title"],"sk":["salary"],"all":[{"name":"title","index":"gsi4pk-gsi4sk-index","type":"sk"},{"name":"salary","index":"gsi4pk-gsi4sk-index","type":"sk"}]},"gsi5pk-gsi5sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["manager"],"sk":["team","office"],"all":[{"name":"manager","index":"gsi5pk-gsi5sk-index","type":"sk"},{"name":"team","index":"gsi5pk-gsi5sk-index","type":"sk"},{"name":"office","index":"gsi5pk-gsi5sk-index","type":"sk"}]}},"byFacet":{"employee":[[{"index":"","name":"employee","type":"pk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":""}],null,null,[{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":""}]],"office":[[{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":"team"}],null,[{"index":"gsi5pk-gsi5sk-index","name":"office","type":"sk","next":""}]],"team":[[{"index":"gsi2pk-gsi2sk-index","name":"team","type":"pk","next":"dateHired"}],[{"index":"gsi1pk-gsi1sk-index","name":"team","type":"sk","next":"title"},{"index":"gsi5pk-gsi5sk-index","name":"team","type":"sk","next":"office"}]],"title":[[{"index":"gsi4pk-gsi4sk-index","name":"title","type":"pk","next":"salary"}],null,[{"index":"gsi1pk-gsi1sk-index","name":"title","type":"sk","next":"employee"},{"index":"gsi2pk-gsi2sk-index","name":"title","type":"sk","next":""}]],"dateHired":[null,[{"index":"gsi2pk-gsi2sk-index","name":"dateHired","type":"sk","next":"title"}]],"salary":[null,[{"index":"gsi4pk-gsi4sk-index","name":"salary","type":"sk","next":""}]],"manager":[[{"index":"gsi5pk-gsi5sk-index","name":"manager","type":"pk","next":"team"}]]},"byAttr":{"employee":[{"index":"","name":"employee","type":"pk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":""}],"office":[{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":"team"},{"index":"gsi5pk-gsi5sk-index","name":"office","type":"sk","next":""}],"team":[{"index":"gsi1pk-gsi1sk-index","name":"team","type":"sk","next":"title"},{"index":"gsi2pk-gsi2sk-index","name":"team","type":"pk","next":"dateHired"},{"index":"gsi5pk-gsi5sk-index","name":"team","type":"sk","next":"office"}],"title":[{"index":"gsi1pk-gsi1sk-index","name":"title","type":"sk","next":"employee"},{"index":"gsi2pk-gsi2sk-index","name":"title","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"title","type":"pk","next":"salary"}],"dateHired":[{"index":"gsi2pk-gsi2sk-index","name":"dateHired","type":"sk","next":"title"}],"salary":[{"index":"gsi4pk-gsi4sk-index","name":"salary","type":"sk","next":""}],"manager":[{"index":"gsi5pk-gsi5sk-index","name":"manager","type":"pk","next":"team"}]},"byType":{"pk":[{"index":"","name":"employee","type":"pk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":"team"},{"index":"gsi2pk-gsi2sk-index","name":"team","type":"pk","next":"dateHired"},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"title","type":"pk","next":"salary"},{"index":"gsi5pk-gsi5sk-index","name":"manager","type":"pk","next":"team"}],"sk":[{"index":"gsi1pk-gsi1sk-index","name":"team","type":"sk","next":"title"},{"index":"gsi1pk-gsi1sk-index","name":"title","type":"sk","next":"employee"},{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":""},{"index":"gsi2pk-gsi2sk-index","name":"dateHired","type":"sk","next":"title"},{"index":"gsi2pk-gsi2sk-index","name":"title","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"salary","type":"sk","next":""},{"index":"gsi5pk-gsi5sk-index","name":"team","type":"sk","next":"office"},{"index":"gsi5pk-gsi5sk-index","name":"office","type":"sk","next":""}]},"bySlot":[[{"index":"","name":"employee","type":"pk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":"team"},{"index":"gsi2pk-gsi2sk-index","name":"team","type":"pk","next":"dateHired"},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"title","type":"pk","next":"salary"},{"index":"gsi5pk-gsi5sk-index","name":"manager","type":"pk","next":"team"}],[null,{"index":"gsi1pk-gsi1sk-index","name":"team","type":"sk","next":"title"},{"index":"gsi2pk-gsi2sk-index","name":"dateHired","type":"sk","next":"title"},null,{"index":"gsi4pk-gsi4sk-index","name":"salary","type":"sk","next":""},{"index":"gsi5pk-gsi5sk-index","name":"team","type":"sk","next":"office"}],[null,{"index":"gsi1pk-gsi1sk-index","name":"title","type":"sk","next":"employee"},{"index":"gsi2pk-gsi2sk-index","name":"title","type":"sk","next":""},null,null,{"index":"gsi5pk-gsi5sk-index","name":"office","type":"sk","next":""}],[null,{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":""}]],"fields":["sk","pk","gsi1sk","gsi1pk","gsi2sk","gsi2pk","gsi3sk","gsi3pk","gsi4sk","gsi4pk","gsi5sk","gsi5pk"],"attributes":[{"name":"employee","index":"","type":"sk"},{"name":"office","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"team","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"title","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"employee","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"team","index":"gsi2pk-gsi2sk-index","type":"sk"},{"name":"dateHired","index":"gsi2pk-gsi2sk-index","type":"sk"},{"name":"title","index":"gsi2pk-gsi2sk-index","type":"sk"},{"name":"employee","index":"gsi3pk-gsi3sk-index","type":"sk"},{"name":"title","index":"gsi4pk-gsi4sk-index","type":"sk"},{"name":"salary","index":"gsi4pk-gsi4sk-index","type":"sk"},{"name":"manager","index":"gsi5pk-gsi5sk-index","type":"sk"},{"name":"team","index":"gsi5pk-gsi5sk-index","type":"sk"},{"name":"office","index":"gsi5pk-gsi5sk-index","type":"sk"}],"labels":{}},"indexes":{"employee":{"pk":{"accessPattern":"employee","facetLabels":{},"index":"","type":"pk","field":"pk","facets":["employee"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"employee","index":"","type":"sk","field":"sk","facets":[],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":""},"coworkers":{"pk":{"accessPattern":"coworkers","facetLabels":{},"index":"gsi1pk-gsi1sk-index","type":"pk","field":"gsi1pk","facets":["office"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"coworkers","index":"gsi1pk-gsi1sk-index","type":"sk","field":"gsi1sk","facets":["team","title","employee"],"isCustom":false},"collection":"workplaces","customFacets":{"pk":false,"sk":false},"index":"gsi1pk-gsi1sk-index"},"teams":{"pk":{"accessPattern":"teams","facetLabels":{},"index":"gsi2pk-gsi2sk-index","type":"pk","field":"gsi2pk","facets":["team"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"teams","index":"gsi2pk-gsi2sk-index","type":"sk","field":"gsi2sk","facets":["dateHired","title"],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":"gsi2pk-gsi2sk-index"},"employeeLookup":{"pk":{"accessPattern":"employeeLookup","facetLabels":{},"index":"gsi3pk-gsi3sk-index","type":"pk","field":"gsi3pk","facets":["employee"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"employeeLookup","index":"gsi3pk-gsi3sk-index","type":"sk","field":"gsi3sk","facets":[],"isCustom":false},"collection":"assignments","customFacets":{"pk":false,"sk":false},"index":"gsi3pk-gsi3sk-index"},"roles":{"pk":{"accessPattern":"roles","facetLabels":{},"index":"gsi4pk-gsi4sk-index","type":"pk","field":"gsi4pk","facets":["title"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"roles","index":"gsi4pk-gsi4sk-index","type":"sk","field":"gsi4sk","facets":["salary"],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":"gsi4pk-gsi4sk-index"},"directReports":{"pk":{"accessPattern":"directReports","facetLabels":{},"index":"gsi5pk-gsi5sk-index","type":"pk","field":"gsi5pk","facets":["manager"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"directReports","index":"gsi5pk-gsi5sk-index","type":"sk","field":"gsi5sk","facets":["team","office"],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":"gsi5pk-gsi5sk-index"}},"filters":{},"prefixes":{"":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$employees_1","isCustom":false}},"gsi1pk-gsi1sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$workplaces#employees_1","isCustom":false}},"gsi2pk-gsi2sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$employees_1","isCustom":false}},"gsi3pk-gsi3sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$assignments#employees_1","isCustom":false}},"gsi4pk-gsi4sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$employees_1","isCustom":false}},"gsi5pk-gsi5sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$employees_1","isCustom":false}}},"collections":["workplaces","assignments"],"lookup":{"indexHasSortKeys":{"":true,"gsi1pk-gsi1sk-index":true,"gsi2pk-gsi2sk-index":true,"gsi3pk-gsi3sk-index":true,"gsi4pk-gsi4sk-index":true,"gsi5pk-gsi5sk-index":true}},"translations":{"keys":{"":{"pk":"pk","sk":"sk"},"gsi1pk-gsi1sk-index":{"pk":"gsi1pk","sk":"gsi1sk"},"gsi2pk-gsi2sk-index":{"pk":"gsi2pk","sk":"gsi2sk"},"gsi3pk-gsi3sk-index":{"pk":"gsi3pk","sk":"gsi3sk"},"gsi4pk-gsi4sk-index":{"pk":"gsi4pk","sk":"gsi4sk"},"gsi5pk-gsi5sk-index":{"pk":"gsi5pk","sk":"gsi5sk"}},"indexes":{"fromAccessPatternToIndex":{"employee":"","coworkers":"gsi1pk-gsi1sk-index","teams":"gsi2pk-gsi2sk-index","employeeLookup":"gsi3pk-gsi3sk-index","roles":"gsi4pk-gsi4sk-index","directReports":"gsi5pk-gsi5sk-index"},"fromIndexToAccessPattern":{"":"employee","gsi1pk-gsi1sk-index":"coworkers","gsi2pk-gsi2sk-index":"teams","gsi3pk-gsi3sk-index":"employeeLookup","gsi4pk-gsi4sk-index":"roles","gsi5pk-gsi5sk-index":"directReports"}},"collections":{"fromCollectionToIndex":{"workplaces":"gsi1pk-gsi1sk-index","assignments":"gsi3pk-gsi3sk-index"},"fromIndexToCollection":{"gsi1pk-gsi1sk-index":"workplaces","gsi3pk-gsi3sk-index":"assignments"}}},"original":{"model":{"entity":"employees","version":"1","service":"taskapp"},"attributes":{"employee":{"type":"string"},"firstName":{"type":"string","required":true},"lastName":{"type":"string","required":true},"office":{"type":"string","required":true},"title":{"type":"string","required":true},"team":{"type":["development","marketing","finance","product","cool cats and kittens"],"required":true},"salary":{"type":"string","required":true},"manager":{"type":"string"},"dateHired":{"type":"string"},"birthday":{"type":"string"}},"indexes":{"employee":{"pk":{"field":"pk","facets":["employee"]},"sk":{"field":"sk","facets":[]}},"coworkers":{"index":"gsi1pk-gsi1sk-index","collection":"workplaces","pk":{"field":"gsi1pk","facets":["office"]},"sk":{"field":"gsi1sk","facets":["team","title","employee"]}},"teams":{"index":"gsi2pk-gsi2sk-index","pk":{"field":"gsi2pk","facets":["team"]},"sk":{"field":"gsi2sk","facets":["dateHired","title"]}},"employeeLookup":{"collection":"assignments","index":"gsi3pk-gsi3sk-index","pk":{"field":"gsi3pk","facets":["employee"]},"sk":{"field":"gsi3sk","facets":[]}},"roles":{"index":"gsi4pk-gsi4sk-index","pk":{"field":"gsi4pk","facets":["title"]},"sk":{"field":"gsi4sk","facets":["salary"]}},"directReports":{"index":"gsi5pk-gsi5sk-index","pk":{"field":"gsi5pk","facets":["manager"]},"sk":{"field":"gsi5sk","facets":["team","office"]}}},"filters":{}}};
        identifiers: {"entity":"__edb_e__","version":"__edb_v__"};
    }
}

export declare namespace tasksEntity {
    namespace WhereClause {
        const taskSymbol: unique symbol;

        const projectSymbol: unique symbol;

        const employeeSymbol: unique symbol;

        const descriptionSymbol: unique symbol;

        const statusSymbol: unique symbol;

        const pointsSymbol: unique symbol;

        const commentsSymbol: unique symbol;

        interface task {
            [taskSymbol]: void;
        }

        interface project {
            [projectSymbol]: void;
        }

        interface employee {
            [employeeSymbol]: void;
        }

        interface description {
            [descriptionSymbol]: void;
        }

        interface status {
            [statusSymbol]: void;
        }

        interface points {
            [pointsSymbol]: void;
        }

        interface comments {
            [commentsSymbol]: void;
        }

        type AttributeName = task | project | employee | description | status | points | comments

        type AttributeType<T extends AttributeName> =
            T extends task ? string :
            T extends project ? string :
            T extends employee ? string :
            T extends description ? string :
            T extends status ? statusEnum :
            T extends points ? number :
            T extends comments ? any :
            never;

        type Operations = {
            eq: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            gt: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            lt: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            gte: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            lte: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            between: <T extends AttributeName>(attr: T, value: AttributeType<T>, value2: AttributeType<T>) => string,
            begins: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            exists: <T extends AttributeName>(attr: T) => string,
            notExists: <T extends AttributeName>(attr: T) => string,
            contains: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            notContains: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            value: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            name: <T extends AttributeName>(attr: T) => string,
        };

        type Attributes = {
            task: task;
            project: project;
            employee: employee;
            description: description;
            status: status;
            points: points;
            comments: comments;
        }

        type Callback = (attr: Attributes, op: Operations) => string;
    }

    type statusEnum = "open" | "in-progress" | "closed";

    type TableIndexNames = "pk" | "sk";

    export type Item = {
        task?: string
        project?: string
        employee?: string
        description?: string
        status?: statusEnum
        points?: number
        comments?: any
    }

    export type Attributes = {
        task: string
        project: string
        employee: string
        description: string
        status: statusEnum
        points: number
        comments: any
    }

    export type RawItem = {
        sk: string
        pk: string
        gsi1sk: string
        gsi1pk: string
        gsi3sk: string
        gsi3pk: string
        gsi4sk: string
        gsi4pk: string
        task?: string
        project?: string
        employee?: string
        description?: string
        status?: statusEnum
        points?: number
        comments?: any
    }

    type config = {
        raw?: boolean,
        params?: Object,
        includeKeys?: boolean,
        originalErr?: boolean,
    }

    type NonReadOnlyProperties = {
        description?: string
        status?: statusEnum
        points?: number
        comments?: any
    }

    type taskIndex = { task: string } | { task: string, project: string } | { task: string, project: string, employee: string }

    type projectIndex = { project: string } | { project: string, employee: string } | { project: string, employee: string, status: statusEnum }

    type projectIndexPK = {}

    type projectIndexSK = { project: string } | { project: string, employee: string } | { project: string, employee: string, status: statusEnum }

    type assignedIndex = { employee: string } | { employee: string, project: string } | { employee: string, project: string, status: statusEnum }

    type assignedIndexPK = {}

    type assignedIndexSK = { employee: string } | { employee: string, project: string } | { employee: string, project: string, status: statusEnum }

    type statusesIndex = { status: statusEnum } | { status: statusEnum, project: string } | { status: statusEnum, project: string, employee: string }

    type statusesIndexPK = {}

    type statusesIndexSK = { status: statusEnum } | { status: statusEnum, project: string } | { status: statusEnum, project: string, employee: string }

    // Figure out better typing for value here
    type FilterOperations<T> = {
        gte: (value: T) => string
        gt: (value: T) => string
        lte: (value: T) => string
        lt: (value: T) => string
        eq: (value: T) => string
        begins: (value: T) => string
        exists: () => T
        notExists: () => T
        contains: (value: T) => string
        notContains: (value: T) => string
        between: (start: T, end: T) => string
        name: () => T
        value: (value: T) => string
    };

    type FilterAttributes<T extends Attributes> = {
        [K in keyof T]: FilterOperations<T[K]>
    }

    type GoRecord<T> = () => Promise<T>

    type PageRecord = (page?: taskIndex | null) => Promise<[Item | null, Item[]]>

    type ParamRecord = () => Object

    type FilterRecords = (filter: <T extends Attributes>(record: FilterAttributes<T>) => string) => RecordsActionOptions

    type WhereRecords = (where: WhereClause.Callback) => RecordsActionOptions

    type RecordsActionOptions = {
        go: GoRecord<Item[]>
        params: ParamRecord
        page: PageRecord
        filter: FilterRecords
        where: WhereRecords
    }

    type SetRecordActionOptions = {
        go: GoRecord<Item[]>
        params: ParamRecord
        filter: FilterRecords
        page: PageRecord
        set: SetRecord
        where: WhereRecords
    }

    type SetRecord = (properties: Partial<NonReadOnlyProperties>) => SetRecordActionOptions

    type QueryOperations<T> = {
        between: (skFacetsStart: T, skFacetsEnd: T) => RecordsActionOptions
        gt: (skFacets: T) => RecordsActionOptions
        gte: (skFacets: T) => RecordsActionOptions
        lt: (skFacets: T) => RecordsActionOptions
        lte: (skFacets: T) => RecordsActionOptions
        go: GoRecord<Item[]>
        params: ParamRecord
        page: PageRecord
        filter: FilterRecords
        where: WhereRecords
    }

    class tasks {
        get: (key: taskIndex) => {go: GoRecord<Item>};
        delete: (key: taskIndex) => {go: GoRecord<Item>};
        update: (key: taskIndex) => {set: SetRecord};
        patch: (key: taskIndex) => {set: SetRecord};
        put: (record: Item) => {go: GoRecord<Item>};
        create: (record: Item) => {go: GoRecord<Item>};
        find: (record: Partial<Item>) => RecordsActionOptions;
        setIdentifier: (type: "model" | "table", value: string) => void
        query: {
            task: (key: taskIndex) => RecordsActionOptions,
            project: (key: projectIndex) => QueryOperations<projectIndexSK>
            assigned: (key: assignedIndex) => QueryOperations<assignedIndexSK>
            statuses: (key: statusesIndex) => QueryOperations<statusesIndexSK>
        };
        model: {"modelVersion":"v1","service":"taskapp","version":"1","entity":"tasks","table":"electro","schema":{"attributes":{"task":{"name":"task","field":"task","readOnly":true,"required":false,"indexes":[{"index":"","name":"task","type":"pk","next":"project"}],"type":"string","enumArray":[]},"project":{"name":"project","field":"project","readOnly":true,"required":false,"indexes":[{"index":"","name":"project","type":"sk","next":"employee"},{"index":"gsi1pk-gsi1sk-index","name":"project","type":"pk","next":"employee"},{"index":"gsi3pk-gsi3sk-index","name":"project","type":"sk","next":"status"},{"index":"gsi4pk-gsi4sk-index","name":"project","type":"sk","next":"employee"}],"type":"string","enumArray":[]},"employee":{"name":"employee","field":"employee","readOnly":true,"required":false,"indexes":[{"index":"","name":"employee","type":"sk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":"status"},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":"project"},{"index":"gsi4pk-gsi4sk-index","name":"employee","type":"sk","next":""}],"type":"string","enumArray":[]},"description":{"name":"description","field":"description","readOnly":false,"required":false,"indexes":[],"type":"string","enumArray":[]},"status":{"name":"status","field":"status","readOnly":false,"required":false,"indexes":[{"index":"gsi1pk-gsi1sk-index","name":"status","type":"sk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"status","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"status","type":"pk","next":"project"}],"type":"enum","enumArray":["open","in-progress","closed"]},"points":{"name":"points","field":"points","readOnly":false,"required":false,"indexes":[],"type":"number","enumArray":[]},"comments":{"name":"comments","field":"comments","readOnly":false,"required":false,"indexes":[],"type":"any","enumArray":[]}},"enums":{},"translationForTable":{"task":"task","project":"project","employee":"employee","description":"description","status":"status","points":"points","comments":"comments"},"translationForRetrieval":{"task":"task","project":"project","employee":"employee","description":"description","status":"status","points":"points","comments":"comments"}},"facets":{"byIndex":{"":{"customFacets":{"pk":false,"sk":false},"pk":["task"],"sk":["project","employee"],"all":[{"name":"task","index":"","type":"sk"},{"name":"project","index":"","type":"sk"},{"name":"employee","index":"","type":"sk"}]},"gsi1pk-gsi1sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["project"],"sk":["employee","status"],"all":[{"name":"project","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"employee","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"status","index":"gsi1pk-gsi1sk-index","type":"sk"}]},"gsi3pk-gsi3sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["employee"],"sk":["project","status"],"all":[{"name":"employee","index":"gsi3pk-gsi3sk-index","type":"sk"},{"name":"project","index":"gsi3pk-gsi3sk-index","type":"sk"},{"name":"status","index":"gsi3pk-gsi3sk-index","type":"sk"}],"collection":"assignments"},"gsi4pk-gsi4sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["status"],"sk":["project","employee"],"all":[{"name":"status","index":"gsi4pk-gsi4sk-index","type":"sk"},{"name":"project","index":"gsi4pk-gsi4sk-index","type":"sk"},{"name":"employee","index":"gsi4pk-gsi4sk-index","type":"sk"}]}},"byFacet":{"task":[[{"index":"","name":"task","type":"pk","next":"project"}]],"project":[[{"index":"gsi1pk-gsi1sk-index","name":"project","type":"pk","next":"employee"}],[{"index":"","name":"project","type":"sk","next":"employee"},{"index":"gsi3pk-gsi3sk-index","name":"project","type":"sk","next":"status"},{"index":"gsi4pk-gsi4sk-index","name":"project","type":"sk","next":"employee"}]],"employee":[[{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":"project"}],[{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":"status"}],[{"index":"","name":"employee","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"employee","type":"sk","next":""}]],"status":[[{"index":"gsi4pk-gsi4sk-index","name":"status","type":"pk","next":"project"}],null,[{"index":"gsi1pk-gsi1sk-index","name":"status","type":"sk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"status","type":"sk","next":""}]]},"byAttr":{"task":[{"index":"","name":"task","type":"pk","next":"project"}],"project":[{"index":"","name":"project","type":"sk","next":"employee"},{"index":"gsi1pk-gsi1sk-index","name":"project","type":"pk","next":"employee"},{"index":"gsi3pk-gsi3sk-index","name":"project","type":"sk","next":"status"},{"index":"gsi4pk-gsi4sk-index","name":"project","type":"sk","next":"employee"}],"employee":[{"index":"","name":"employee","type":"sk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":"status"},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":"project"},{"index":"gsi4pk-gsi4sk-index","name":"employee","type":"sk","next":""}],"status":[{"index":"gsi1pk-gsi1sk-index","name":"status","type":"sk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"status","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"status","type":"pk","next":"project"}]},"byType":{"pk":[{"index":"","name":"task","type":"pk","next":"project"},{"index":"gsi1pk-gsi1sk-index","name":"project","type":"pk","next":"employee"},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":"project"},{"index":"gsi4pk-gsi4sk-index","name":"status","type":"pk","next":"project"}],"sk":[{"index":"","name":"project","type":"sk","next":"employee"},{"index":"","name":"employee","type":"sk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":"status"},{"index":"gsi1pk-gsi1sk-index","name":"status","type":"sk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"project","type":"sk","next":"status"},{"index":"gsi3pk-gsi3sk-index","name":"status","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"project","type":"sk","next":"employee"},{"index":"gsi4pk-gsi4sk-index","name":"employee","type":"sk","next":""}]},"bySlot":[[{"index":"","name":"task","type":"pk","next":"project"},{"index":"gsi1pk-gsi1sk-index","name":"project","type":"pk","next":"employee"},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":"project"},{"index":"gsi4pk-gsi4sk-index","name":"status","type":"pk","next":"project"}],[{"index":"","name":"project","type":"sk","next":"employee"},{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":"status"},{"index":"gsi3pk-gsi3sk-index","name":"project","type":"sk","next":"status"},{"index":"gsi4pk-gsi4sk-index","name":"project","type":"sk","next":"employee"}],[{"index":"","name":"employee","type":"sk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"status","type":"sk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"status","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"employee","type":"sk","next":""}]],"fields":["sk","pk","gsi1sk","gsi1pk","gsi3sk","gsi3pk","gsi4sk","gsi4pk"],"attributes":[{"name":"task","index":"","type":"sk"},{"name":"project","index":"","type":"sk"},{"name":"employee","index":"","type":"sk"},{"name":"project","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"employee","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"status","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"employee","index":"gsi3pk-gsi3sk-index","type":"sk"},{"name":"project","index":"gsi3pk-gsi3sk-index","type":"sk"},{"name":"status","index":"gsi3pk-gsi3sk-index","type":"sk"},{"name":"status","index":"gsi4pk-gsi4sk-index","type":"sk"},{"name":"project","index":"gsi4pk-gsi4sk-index","type":"sk"},{"name":"employee","index":"gsi4pk-gsi4sk-index","type":"sk"}],"labels":{}},"indexes":{"task":{"pk":{"accessPattern":"task","facetLabels":{},"index":"","type":"pk","field":"pk","facets":["task"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"task","index":"","type":"sk","field":"sk","facets":["project","employee"],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":""},"project":{"pk":{"accessPattern":"project","facetLabels":{},"index":"gsi1pk-gsi1sk-index","type":"pk","field":"gsi1pk","facets":["project"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"project","index":"gsi1pk-gsi1sk-index","type":"sk","field":"gsi1sk","facets":["employee","status"],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":"gsi1pk-gsi1sk-index"},"assigned":{"pk":{"accessPattern":"assigned","facetLabels":{},"index":"gsi3pk-gsi3sk-index","type":"pk","field":"gsi3pk","facets":["employee"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"assigned","index":"gsi3pk-gsi3sk-index","type":"sk","field":"gsi3sk","facets":["project","status"],"isCustom":false},"collection":"assignments","customFacets":{"pk":false,"sk":false},"index":"gsi3pk-gsi3sk-index"},"statuses":{"pk":{"accessPattern":"statuses","facetLabels":{},"index":"gsi4pk-gsi4sk-index","type":"pk","field":"gsi4pk","facets":["status"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"statuses","index":"gsi4pk-gsi4sk-index","type":"sk","field":"gsi4sk","facets":["project","employee"],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":"gsi4pk-gsi4sk-index"}},"filters":{},"prefixes":{"":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$tasks_1","isCustom":false}},"gsi1pk-gsi1sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$tasks_1","isCustom":false}},"gsi3pk-gsi3sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$assignments#tasks_1","isCustom":false}},"gsi4pk-gsi4sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$tasks_1","isCustom":false}}},"collections":["assignments"],"lookup":{"indexHasSortKeys":{"":true,"gsi1pk-gsi1sk-index":true,"gsi3pk-gsi3sk-index":true,"gsi4pk-gsi4sk-index":true}},"translations":{"keys":{"":{"pk":"pk","sk":"sk"},"gsi1pk-gsi1sk-index":{"pk":"gsi1pk","sk":"gsi1sk"},"gsi3pk-gsi3sk-index":{"pk":"gsi3pk","sk":"gsi3sk"},"gsi4pk-gsi4sk-index":{"pk":"gsi4pk","sk":"gsi4sk"}},"indexes":{"fromAccessPatternToIndex":{"task":"","project":"gsi1pk-gsi1sk-index","assigned":"gsi3pk-gsi3sk-index","statuses":"gsi4pk-gsi4sk-index"},"fromIndexToAccessPattern":{"":"task","gsi1pk-gsi1sk-index":"project","gsi3pk-gsi3sk-index":"assigned","gsi4pk-gsi4sk-index":"statuses"}},"collections":{"fromCollectionToIndex":{"assignments":"gsi3pk-gsi3sk-index"},"fromIndexToCollection":{"gsi3pk-gsi3sk-index":"assignments"}}},"original":{"model":{"entity":"tasks","version":"1","service":"taskapp"},"attributes":{"task":{"type":"string"},"project":{"type":"string"},"employee":{"type":"string"},"description":{"type":"string"},"status":{"type":["open","in-progress","closed"]},"points":{"type":"number"},"comments":{"type":"any"}},"indexes":{"task":{"pk":{"field":"pk","facets":["task"]},"sk":{"field":"sk","facets":["project","employee"]}},"project":{"index":"gsi1pk-gsi1sk-index","pk":{"field":"gsi1pk","facets":["project"]},"sk":{"field":"gsi1sk","facets":["employee","status"]}},"assigned":{"collection":"assignments","index":"gsi3pk-gsi3sk-index","pk":{"field":"gsi3pk","facets":["employee"]},"sk":{"field":"gsi3sk","facets":["project","status"]}},"statuses":{"index":"gsi4pk-gsi4sk-index","pk":{"field":"gsi4pk","facets":["status"]},"sk":{"field":"gsi4sk","facets":["project","employee"]}}}}};
        identifiers: {"entity":"__edb_e__","version":"__edb_v__"};
    }
}

export declare namespace officesEntity {
    namespace WhereClause {
        const officeSymbol: unique symbol;

        const countrySymbol: unique symbol;

        const stateSymbol: unique symbol;

        const citySymbol: unique symbol;

        const zipSymbol: unique symbol;

        const addressSymbol: unique symbol;

        interface office {
            [officeSymbol]: void;
        }

        interface country {
            [countrySymbol]: void;
        }

        interface state {
            [stateSymbol]: void;
        }

        interface city {
            [citySymbol]: void;
        }

        interface zip {
            [zipSymbol]: void;
        }

        interface address {
            [addressSymbol]: void;
        }

        type AttributeName = office | country | state | city | zip | address

        type AttributeType<T extends AttributeName> =
            T extends office ? string :
            T extends country ? string :
            T extends state ? string :
            T extends city ? string :
            T extends zip ? string :
            T extends address ? string :
            never;

        type Operations = {
            eq: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            gt: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            lt: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            gte: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            lte: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            between: <T extends AttributeName>(attr: T, value: AttributeType<T>, value2: AttributeType<T>) => string,
            begins: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            exists: <T extends AttributeName>(attr: T) => string,
            notExists: <T extends AttributeName>(attr: T) => string,
            contains: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            notContains: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            value: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string,
            name: <T extends AttributeName>(attr: T) => string,
        };

        type Attributes = {
            office: office;
            country: country;
            state: state;
            city: city;
            zip: zip;
            address: address;
        }

        type Callback = (attr: Attributes, op: Operations) => string;
    }

    type TableIndexNames = "pk" | "sk";

    export type Item = {
        office?: string
        country?: string
        state?: string
        city?: string
        zip?: string
        address?: string
    }

    export type Attributes = {
        office: string
        country: string
        state: string
        city: string
        zip: string
        address: string
    }

    export type RawItem = {
        sk: string
        pk: string
        gsi1sk: string
        gsi1pk: string
        office?: string
        country?: string
        state?: string
        city?: string
        zip?: string
        address?: string
    }

    type config = {
        raw?: boolean,
        params?: Object,
        includeKeys?: boolean,
        originalErr?: boolean,
    }

    type NonReadOnlyProperties = {
        address?: string
    }

    type locationsIndex = { country: string } | { country: string, state: string } | { country: string, state: string, city: string } | { country: string, state: string, city: string, zip: string } | { country: string, state: string, city: string, zip: string, office: string }

    type officeIndex = { office: string }

    type officeIndexPK = {}

    type officeIndexSK = { office: string }

    // Figure out better typing for value here
    type FilterOperations<T> = {
        gte: (value: T) => string
        gt: (value: T) => string
        lte: (value: T) => string
        lt: (value: T) => string
        eq: (value: T) => string
        begins: (value: T) => string
        exists: () => T
        notExists: () => T
        contains: (value: T) => string
        notContains: (value: T) => string
        between: (start: T, end: T) => string
        name: () => T
        value: (value: T) => string
    };

    type FilterAttributes<T extends Attributes> = {
        [K in keyof T]: FilterOperations<T[K]>
    }

    type GoRecord<T> = () => Promise<T>

    type PageRecord = (page?: locationsIndex | null) => Promise<[Item | null, Item[]]>

    type ParamRecord = () => Object

    type FilterRecords = (filter: <T extends Attributes>(record: FilterAttributes<T>) => string) => RecordsActionOptions

    type WhereRecords = (where: WhereClause.Callback) => RecordsActionOptions

    type RecordsActionOptions = {
        go: GoRecord<Item[]>
        params: ParamRecord
        page: PageRecord
        filter: FilterRecords
        where: WhereRecords
    }

    type SetRecordActionOptions = {
        go: GoRecord<Item[]>
        params: ParamRecord
        filter: FilterRecords
        page: PageRecord
        set: SetRecord
        where: WhereRecords
    }

    type SetRecord = (properties: Partial<NonReadOnlyProperties>) => SetRecordActionOptions

    type QueryOperations<T> = {
        between: (skFacetsStart: T, skFacetsEnd: T) => RecordsActionOptions
        gt: (skFacets: T) => RecordsActionOptions
        gte: (skFacets: T) => RecordsActionOptions
        lt: (skFacets: T) => RecordsActionOptions
        lte: (skFacets: T) => RecordsActionOptions
        go: GoRecord<Item[]>
        params: ParamRecord
        page: PageRecord
        filter: FilterRecords
        where: WhereRecords
    }

    class offices {
        get: (key: locationsIndex) => {go: GoRecord<Item>};
        delete: (key: locationsIndex) => {go: GoRecord<Item>};
        update: (key: locationsIndex) => {set: SetRecord};
        patch: (key: locationsIndex) => {set: SetRecord};
        put: (record: Item) => {go: GoRecord<Item>};
        create: (record: Item) => {go: GoRecord<Item>};
        find: (record: Partial<Item>) => RecordsActionOptions;
        setIdentifier: (type: "model" | "table", value: string) => void
        query: {
            locations: (key: locationsIndex) => RecordsActionOptions,
            office: (key: officeIndex) => QueryOperations<officeIndexSK>
        };
        model: {"modelVersion":"v1","service":"taskapp","version":"1","entity":"offices","table":"electro","schema":{"attributes":{"office":{"name":"office","field":"office","readOnly":true,"required":false,"indexes":[{"index":"","name":"office","type":"sk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":""}],"type":"string","enumArray":[]},"country":{"name":"country","field":"country","readOnly":true,"required":false,"indexes":[{"index":"","name":"country","type":"pk","next":"state"}],"type":"string","enumArray":[]},"state":{"name":"state","field":"state","readOnly":true,"required":false,"indexes":[{"index":"","name":"state","type":"pk","next":"city"}],"type":"string","enumArray":[]},"city":{"name":"city","field":"city","readOnly":true,"required":false,"indexes":[{"index":"","name":"city","type":"sk","next":"zip"}],"type":"string","enumArray":[]},"zip":{"name":"zip","field":"zip","readOnly":true,"required":false,"indexes":[{"index":"","name":"zip","type":"sk","next":"office"}],"type":"string","enumArray":[]},"address":{"name":"address","field":"address","readOnly":false,"required":false,"indexes":[],"type":"string","enumArray":[]}},"enums":{},"translationForTable":{"office":"office","country":"country","state":"state","city":"city","zip":"zip","address":"address"},"translationForRetrieval":{"office":"office","country":"country","state":"state","city":"city","zip":"zip","address":"address"}},"facets":{"byIndex":{"":{"customFacets":{"pk":false,"sk":false},"pk":["country","state"],"sk":["city","zip","office"],"all":[{"name":"country","index":"","type":"sk"},{"name":"state","index":"","type":"sk"},{"name":"city","index":"","type":"sk"},{"name":"zip","index":"","type":"sk"},{"name":"office","index":"","type":"sk"}]},"gsi1pk-gsi1sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["office"],"sk":[],"all":[{"name":"office","index":"gsi1pk-gsi1sk-index","type":"sk"}],"collection":"workplaces"}},"byFacet":{"country":[[{"index":"","name":"country","type":"pk","next":"state"}]],"state":[null,[{"index":"","name":"state","type":"pk","next":"city"}]],"city":[null,null,[{"index":"","name":"city","type":"sk","next":"zip"}]],"zip":[null,null,null,[{"index":"","name":"zip","type":"sk","next":"office"}]],"office":[[{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":""}],null,null,null,[{"index":"","name":"office","type":"sk","next":""}]]},"byAttr":{"country":[{"index":"","name":"country","type":"pk","next":"state"}],"state":[{"index":"","name":"state","type":"pk","next":"city"}],"city":[{"index":"","name":"city","type":"sk","next":"zip"}],"zip":[{"index":"","name":"zip","type":"sk","next":"office"}],"office":[{"index":"","name":"office","type":"sk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":""}]},"byType":{"pk":[{"index":"","name":"country","type":"pk","next":"state"},{"index":"","name":"state","type":"pk","next":"city"},{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":""}],"sk":[{"index":"","name":"city","type":"sk","next":"zip"},{"index":"","name":"zip","type":"sk","next":"office"},{"index":"","name":"office","type":"sk","next":""}]},"bySlot":[[{"index":"","name":"country","type":"pk","next":"state"},{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":""}],[{"index":"","name":"state","type":"pk","next":"city"}],[{"index":"","name":"city","type":"sk","next":"zip"}],[{"index":"","name":"zip","type":"sk","next":"office"}],[{"index":"","name":"office","type":"sk","next":""}]],"fields":["sk","pk","gsi1sk","gsi1pk"],"attributes":[{"name":"country","index":"","type":"sk"},{"name":"state","index":"","type":"sk"},{"name":"city","index":"","type":"sk"},{"name":"zip","index":"","type":"sk"},{"name":"office","index":"","type":"sk"},{"name":"office","index":"gsi1pk-gsi1sk-index","type":"sk"}],"labels":{}},"indexes":{"locations":{"pk":{"accessPattern":"locations","facetLabels":{},"index":"","type":"pk","field":"pk","facets":["country","state"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"locations","index":"","type":"sk","field":"sk","facets":["city","zip","office"],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":""},"office":{"pk":{"accessPattern":"office","facetLabels":{},"index":"gsi1pk-gsi1sk-index","type":"pk","field":"gsi1pk","facets":["office"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"office","index":"gsi1pk-gsi1sk-index","type":"sk","field":"gsi1sk","facets":[],"isCustom":false},"collection":"workplaces","customFacets":{"pk":false,"sk":false},"index":"gsi1pk-gsi1sk-index"}},"filters":{},"prefixes":{"":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$offices_1","isCustom":false}},"gsi1pk-gsi1sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$workplaces#offices_1","isCustom":false}}},"collections":["workplaces"],"lookup":{"indexHasSortKeys":{"":true,"gsi1pk-gsi1sk-index":true}},"translations":{"keys":{"":{"pk":"pk","sk":"sk"},"gsi1pk-gsi1sk-index":{"pk":"gsi1pk","sk":"gsi1sk"}},"indexes":{"fromAccessPatternToIndex":{"locations":"","office":"gsi1pk-gsi1sk-index"},"fromIndexToAccessPattern":{"":"locations","gsi1pk-gsi1sk-index":"office"}},"collections":{"fromCollectionToIndex":{"workplaces":"gsi1pk-gsi1sk-index"},"fromIndexToCollection":{"gsi1pk-gsi1sk-index":"workplaces"}}},"original":{"model":{"entity":"offices","version":"1","service":"taskapp"},"attributes":{"office":{"type":"string"},"country":"string","state":"string","city":"string","zip":"string","address":"string"},"indexes":{"locations":{"pk":{"field":"pk","facets":["country","state"]},"sk":{"field":"sk","facets":["city","zip","office"]}},"office":{"index":"gsi1pk-gsi1sk-index","collection":"workplaces","pk":{"field":"gsi1pk","facets":["office"]},"sk":{"field":"gsi1sk","facets":[]}}}}};
        identifiers: {"entity":"__edb_e__","version":"__edb_v__"};
    }
}

export declare namespace workplacesCollection {
    namespace WhereClause {
        const employeeSymbol: unique symbol;

        const firstNameSymbol: unique symbol;

        const lastNameSymbol: unique symbol;

        const officeSymbol: unique symbol;

        const titleSymbol: unique symbol;

        const teamSymbol: unique symbol;

        const salarySymbol: unique symbol;

        const managerSymbol: unique symbol;

        const dateHiredSymbol: unique symbol;

        const birthdaySymbol: unique symbol;

        const countrySymbol: unique symbol;

        const stateSymbol: unique symbol;

        const citySymbol: unique symbol;

        const zipSymbol: unique symbol;

        const addressSymbol: unique symbol;

        interface employee {
            [employeeSymbol]: void;
        }

        interface firstName {
            [firstNameSymbol]: void;
        }

        interface lastName {
            [lastNameSymbol]: void;
        }

        interface office {
            [officeSymbol]: void;
        }

        interface title {
            [titleSymbol]: void;
        }

        interface team {
            [teamSymbol]: void;
        }

        interface salary {
            [salarySymbol]: void;
        }

        interface manager {
            [managerSymbol]: void;
        }

        interface dateHired {
            [dateHiredSymbol]: void;
        }

        interface birthday {
            [birthdaySymbol]: void;
        }

        interface country {
            [countrySymbol]: void;
        }

        interface state {
            [stateSymbol]: void;
        }

        interface city {
            [citySymbol]: void;
        }

        interface zip {
            [zipSymbol]: void;
        }

        interface address {
            [addressSymbol]: void;
        }

        type AttributesName = employee | firstName | lastName | office | title | team | salary | manager | dateHired | birthday | country | state | city | zip | address

        type AttributeType<T extends AttributesName> =
            T extends employee ? string :
            T extends firstName ? string :
            T extends lastName ? string :
            T extends office ? string :
            T extends title ? string :
            T extends team ? teamEnum :
            T extends salary ? string :
            T extends manager ? string :
            T extends dateHired ? string :
            T extends birthday ? string :
            T extends country ? string :
            T extends state ? string :
            T extends city ? string :
            T extends zip ? string :
            T extends address ? string :
            never;

        type Operations = {
            eq: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            gt: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            lt: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            gte: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            lte: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            between: <T extends AttributesName>(attr: T, value: AttributeType<T>, value2: AttributeType<T>) => string,
            begins: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            exists: <T extends AttributesName>(attr: T) => string,
            notExists: <T extends AttributesName>(attr: T) => string,
            contains: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            notContains: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            value: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            name: <T extends AttributesName>(attr: T) => string,
        };

        type Attributes = {
            employee: employee;
            firstName: firstName;
            lastName: lastName;
            office: office;
            title: title;
            team: team;
            salary: salary;
            manager: manager;
            dateHired: dateHired;
            birthday: birthday;
            country: country;
            state: state;
            city: city;
            zip: zip;
            address: address;
        }

        type Callback = (attr: Attributes, op: Operations) => string;
    }

    type teamEnum = "development" | "marketing" | "finance" | "product" | "cool cats and kittens";

    type IndexFacets = { office: string } | { office: string, team: teamEnum } | { office: string, team: teamEnum, title: string } | { office: string, team: teamEnum, title: string, employee: string }

    type Attributes = {
        employee?: string
        firstName: string
        lastName: string
        office: string
        title: string
        team: teamEnum
        salary: string
        manager?: string
        dateHired?: string
        birthday?: string
        country?: string
        state?: string
        city?: string
        zip?: string
        address?: string
    }

    type employeesItem = {
        employee: string
        firstName: string
        lastName: string
        office: string
        title: string
        team: teamEnum
        salary: string
        manager: string
        dateHired: string
        birthday: string
    }

    type officesItem = {
        office: string
        country: string
        state: string
        city: string
        zip: string
        address: string
    }

    export type Item = {
        employees: employeesItem[]
        offices: officesItem[]
    }

    // Figure out better typing for value here
    type FilterOperations<T> = {
        gte: (value: T) => string
        gt: (value: T) => string
        lte: (value: T) => string
        lt: (value: T) => string
        eq: (value: T) => string
        begins: (value: T) => string
        exists: () => T
        notExists: () => T
        contains: (value: T) => string
        notContains: (value: T) => string
        between: (start: T, end: T) => string
        name: () => T
        value: (value: T) => string
    };

    type FilterAttributes<T extends Attributes> = {
        [K in keyof T]: FilterOperations<T[K]>
    }

    type GoRecord<T> = () => Promise<T>

    type PageRecord = (page?: Attributes | null) => Promise<[Attributes | null, Item[]]>

    type ParamRecord = () => Object

    type FilterRecords = (filter: <T extends Attributes>(record: FilterAttributes<T>) => string) => RecordsActionOptions

    type WhereRecords = (where: WhereClause.Callback) => RecordsActionOptions

    type RecordsActionOptions = {
        go: GoRecord<Item[]>
        params: ParamRecord
        page: PageRecord
        filter: FilterRecords
        where: WhereRecords
    }

    type workplaces = (key: IndexFacets) => RecordsActionOptions
}

export declare namespace assignmentsCollection {
    namespace WhereClause {
        const employeeSymbol: unique symbol;

        const firstNameSymbol: unique symbol;

        const lastNameSymbol: unique symbol;

        const officeSymbol: unique symbol;

        const titleSymbol: unique symbol;

        const teamSymbol: unique symbol;

        const salarySymbol: unique symbol;

        const managerSymbol: unique symbol;

        const dateHiredSymbol: unique symbol;

        const birthdaySymbol: unique symbol;

        const taskSymbol: unique symbol;

        const projectSymbol: unique symbol;

        const descriptionSymbol: unique symbol;

        const statusSymbol: unique symbol;

        const pointsSymbol: unique symbol;

        const commentsSymbol: unique symbol;

        interface employee {
            [employeeSymbol]: void;
        }

        interface firstName {
            [firstNameSymbol]: void;
        }

        interface lastName {
            [lastNameSymbol]: void;
        }

        interface office {
            [officeSymbol]: void;
        }

        interface title {
            [titleSymbol]: void;
        }

        interface team {
            [teamSymbol]: void;
        }

        interface salary {
            [salarySymbol]: void;
        }

        interface manager {
            [managerSymbol]: void;
        }

        interface dateHired {
            [dateHiredSymbol]: void;
        }

        interface birthday {
            [birthdaySymbol]: void;
        }

        interface task {
            [taskSymbol]: void;
        }

        interface project {
            [projectSymbol]: void;
        }

        interface description {
            [descriptionSymbol]: void;
        }

        interface status {
            [statusSymbol]: void;
        }

        interface points {
            [pointsSymbol]: void;
        }

        interface comments {
            [commentsSymbol]: void;
        }

        type AttributesName = employee | firstName | lastName | office | title | team | salary | manager | dateHired | birthday | task | project | description | status | points | comments

        type AttributeType<T extends AttributesName> =
            T extends employee ? string :
            T extends firstName ? string :
            T extends lastName ? string :
            T extends office ? string :
            T extends title ? string :
            T extends team ? teamEnum :
            T extends salary ? string :
            T extends manager ? string :
            T extends dateHired ? string :
            T extends birthday ? string :
            T extends task ? string :
            T extends project ? string :
            T extends description ? string :
            T extends status ? statusEnum :
            T extends points ? number :
            T extends comments ? any :
            never;

        type Operations = {
            eq: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            gt: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            lt: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            gte: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            lte: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            between: <T extends AttributesName>(attr: T, value: AttributeType<T>, value2: AttributeType<T>) => string,
            begins: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            exists: <T extends AttributesName>(attr: T) => string,
            notExists: <T extends AttributesName>(attr: T) => string,
            contains: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            notContains: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            value: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string,
            name: <T extends AttributesName>(attr: T) => string,
        };

        type Attributes = {
            employee: employee;
            firstName: firstName;
            lastName: lastName;
            office: office;
            title: title;
            team: team;
            salary: salary;
            manager: manager;
            dateHired: dateHired;
            birthday: birthday;
            task: task;
            project: project;
            description: description;
            status: status;
            points: points;
            comments: comments;
        }

        type Callback = (attr: Attributes, op: Operations) => string;
    }

    type teamEnum = "development" | "marketing" | "finance" | "product" | "cool cats and kittens";

    type statusEnum = "open" | "in-progress" | "closed";

    type IndexFacets = { employee: string }

    type Attributes = {
        employee?: string
        firstName: string
        lastName: string
        office: string
        title: string
        team: teamEnum
        salary: string
        manager?: string
        dateHired?: string
        birthday?: string
        task?: string
        project?: string
        description?: string
        status?: statusEnum
        points?: number
        comments?: any
    }

    type employeesItem = {
        employee: string
        firstName: string
        lastName: string
        office: string
        title: string
        team: teamEnum
        salary: string
        manager: string
        dateHired: string
        birthday: string
    }

    type tasksItem = {
        task: string
        project: string
        employee: string
        description: string
        status: statusEnum
        points: number
        comments: any
    }

    export type Item = {
        employees: employeesItem[]
        tasks: tasksItem[]
    }

    // Figure out better typing for value here
    type FilterOperations<T> = {
        gte: (value: T) => string
        gt: (value: T) => string
        lte: (value: T) => string
        lt: (value: T) => string
        eq: (value: T) => string
        begins: (value: T) => string
        exists: () => T
        notExists: () => T
        contains: (value: T) => string
        notContains: (value: T) => string
        between: (start: T, end: T) => string
        name: () => T
        value: (value: T) => string
    };

    type FilterAttributes<T extends Attributes> = {
        [K in keyof T]: FilterOperations<T[K]>
    }

    type GoRecord<T> = () => Promise<T>

    type PageRecord = (page?: Attributes | null) => Promise<[Attributes | null, Item[]]>

    type ParamRecord = () => Object

    type FilterRecords = (filter: <T extends Attributes>(record: FilterAttributes<T>) => string) => RecordsActionOptions

    type WhereRecords = (where: WhereClause.Callback) => RecordsActionOptions

    type RecordsActionOptions = {
        go: GoRecord<Item[]>
        params: ParamRecord
        page: PageRecord
        filter: FilterRecords
        where: WhereRecords
    }

    type assignments = (key: IndexFacets) => RecordsActionOptions
}

export declare class Instance {
    service: {
        name: string;
        table: string;
    };
    entities: {
        employees: employeesEntity.employees,
        tasks: tasksEntity.tasks,
        offices: officesEntity.offices,
    };
    collections: {
        workplaces: workplacesCollection.workplaces
        assignments: assignmentsCollection.assignments
    };
}

declare const _default: Instance;

export default _default;
