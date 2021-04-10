export declare namespace Employees {
    namespace Where {
        const EmployeeSymbol: unique symbol;

        const FirstNameSymbol: unique symbol;

        const LastNameSymbol: unique symbol;

        const OfficeSymbol: unique symbol;

        const TitleSymbol: unique symbol;

        const TeamSymbol: unique symbol;

        const SalarySymbol: unique symbol;

        const ManagerSymbol: unique symbol;

        const DateHiredSymbol: unique symbol;

        const BirthdaySymbol: unique symbol;

        interface Employee {
            [EmployeeSymbol]: void;
        }

        interface FirstName {
            [FirstNameSymbol]: void;
        }

        interface LastName {
            [LastNameSymbol]: void;
        }

        interface Office {
            [OfficeSymbol]: void;
        }

        interface Title {
            [TitleSymbol]: void;
        }

        interface Team {
            [TeamSymbol]: void;
        }

        interface Salary {
            [SalarySymbol]: void;
        }

        interface Manager {
            [ManagerSymbol]: void;
        }

        interface DateHired {
            [DateHiredSymbol]: void;
        }

        interface Birthday {
            [BirthdaySymbol]: void;
        }

        type AttributeName = Employee | FirstName | LastName | Office | Title | Team | Salary | Manager | DateHired | Birthday

        type AttributeType<T extends AttributeName> =
            T extends Employee ? string :
            T extends FirstName ? string :
            T extends LastName ? string :
            T extends Office ? string :
            T extends Title ? string :
            T extends Team ? TeamEnum :
            T extends Salary ? string :
            T extends Manager ? string :
            T extends DateHired ? string :
            T extends Birthday ? string :
            never;
        
        type Operations = {
            eq: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            gt: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            lt: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            gte: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            lte: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            between: <T extends AttributeName>(attr: T, value: AttributeType<T>, value2: AttributeType<T>) => string;
            begins: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            exists: <T extends AttributeName>(attr: T) => string;
            notExists: <T extends AttributeName>(attr: T) => string;
            contains: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            notContains: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            value: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            name: <T extends AttributeName>(attr: T) => string;
        };

        type Attributes = {
            employee: Employee;
            firstName: FirstName;
            lastName: LastName;
            office: Office;
            title: Title;
            team: Team;
            salary: Salary;
            manager: Manager;
            dateHired: DateHired;
            birthday: Birthday;
        }

        type Callback = (attr: Attributes, op: Operations) => string;
    }

    namespace Enums {
        export type TeamEnum = "development" | "marketing" | "finance" | "product" | "cool cats and kittens";
    }

    export type TeamEnum = "development" | "marketing" | "finance" | "product" | "cool cats and kittens";

    type TableIndexNames = "pk" | "sk";
    
    export type Item = {
        employee?: string;
        firstName: string;
        lastName: string;
        office: string;
        title: string;
        team: TeamEnum;
        salary: string;
        manager?: string;
        dateHired?: string;
        birthday?: string;
    }
    
    export type Attributes = {
        employee: string;
        firstName: string;
        lastName: string;
        office: string;
        title: string;
        team: TeamEnum;
        salary: string;
        manager: string;
        dateHired: string;
        birthday: string;
    }
    
    export type RawItem = {
        sk: string;
        pk: string;
        gsi1sk: string;
        gsi1pk: string;
        gsi2sk: string;
        gsi2pk: string;
        gsi3sk: string;
        gsi3pk: string;
        gsi4sk: string;
        gsi4pk: string;
        gsi5sk: string;
        gsi5pk: string;
        employee?: string;
        firstName: string;
        lastName: string;
        office: string;
        title: string;
        team: TeamEnum;
        salary: string;
        manager?: string;
        dateHired?: string;
        birthday?: string;
    }
    
    export type config = {
        raw?: boolean;
        params?: object;
        includeKeys?: boolean;
        originalErr?: boolean;
    }
    
    export type NonReadOnlyProperties = {
        firstName: string;
        lastName: string;
        office: string;
        title: string;
        team: TeamEnum;
        salary: string;
        manager?: string;
        dateHired?: string;
        birthday?: string;
    }
    
    export type EmployeeIndexFacets = {
        employee: string;
    }

    export type EmployeeIndex = { employee: string };
    
    export type EmployeeIndexEmployeeRemainders = { employee: string };

    type EmployeeIndexRemainingFacets<T extends EmployeeIndex> = 
        Omit<EmployeeIndexFacets, keyof T> extends EmployeeIndexEmployeeRemainders ? Required<EmployeeIndexEmployeeRemainders> :
        never;

    export type CoworkersIndexFacets = {
        office: string;
        team: TeamEnum;
        title: string;
        employee: string;
    }

    export type CoworkersIndex = { office: string } | { office: string; team: TeamEnum } | { office: string; team: TeamEnum; title: string } | { office: string; team: TeamEnum; title: string; employee: string };
    
    export type CoworkersIndexOfficeRemainders = { office: string } | { office: string; team: TeamEnum } | { office: string; team: TeamEnum; title: string } | { office: string; team: TeamEnum; title: string; employee: string };
    export type CoworkersIndexTeamRemainders = { team: TeamEnum } | { team: TeamEnum; title: string } | { team: TeamEnum; title: string; employee: string };
    export type CoworkersIndexTitleRemainders = { title: string } | { title: string; employee: string };
    export type CoworkersIndexEmployeeRemainders = { employee: string };

    type CoworkersIndexRemainingFacets<T extends CoworkersIndex> = 
        Omit<CoworkersIndexFacets, keyof T> extends CoworkersIndexOfficeRemainders ? Required<CoworkersIndexOfficeRemainders> :
        Omit<CoworkersIndexFacets, keyof T> extends CoworkersIndexTeamRemainders ? Required<CoworkersIndexTeamRemainders> :
        Omit<CoworkersIndexFacets, keyof T> extends CoworkersIndexTitleRemainders ? Required<CoworkersIndexTitleRemainders> :
        Omit<CoworkersIndexFacets, keyof T> extends CoworkersIndexEmployeeRemainders ? Required<CoworkersIndexEmployeeRemainders> :
        never;

    export type CoworkersIndexPK = { office: string };

    export type CoworkersIndexSK = { team: TeamEnum } | { team: TeamEnum; title: string } | { team: TeamEnum; title: string; employee: string };

    export type TeamsIndexFacets = {
        team: TeamEnum;
        dateHired: string;
        title: string;
    }

    export type TeamsIndex = { team: TeamEnum } | { team: TeamEnum; dateHired: string } | { team: TeamEnum; dateHired: string; title: string };
    
    export type TeamsIndexTeamRemainders = { team: TeamEnum } | { team: TeamEnum; dateHired: string } | { team: TeamEnum; dateHired: string; title: string };
    export type TeamsIndexDateHiredRemainders = { dateHired: string } | { dateHired: string; title: string };
    export type TeamsIndexTitleRemainders = { title: string };

    type TeamsIndexRemainingFacets<T extends TeamsIndex> = 
        Omit<TeamsIndexFacets, keyof T> extends TeamsIndexTeamRemainders ? Required<TeamsIndexTeamRemainders> :
        Omit<TeamsIndexFacets, keyof T> extends TeamsIndexDateHiredRemainders ? Required<TeamsIndexDateHiredRemainders> :
        Omit<TeamsIndexFacets, keyof T> extends TeamsIndexTitleRemainders ? Required<TeamsIndexTitleRemainders> :
        never;

    export type TeamsIndexPK = { team: TeamEnum };

    export type TeamsIndexSK = { dateHired: string } | { dateHired: string; title: string };

    export type EmployeeLookupIndexFacets = {
        employee: string;
    }

    export type EmployeeLookupIndex = { employee: string };
    
    export type EmployeeLookupIndexEmployeeRemainders = { employee: string };

    type EmployeeLookupIndexRemainingFacets<T extends EmployeeLookupIndex> = 
        Omit<EmployeeLookupIndexFacets, keyof T> extends EmployeeLookupIndexEmployeeRemainders ? Required<EmployeeLookupIndexEmployeeRemainders> :
        never;

    export type EmployeeLookupIndexPK = { employee: string };

    export type EmployeeLookupIndexSK = {};

    export type RolesIndexFacets = {
        title: string;
        salary: string;
    }

    export type RolesIndex = { title: string } | { title: string; salary: string };
    
    export type RolesIndexTitleRemainders = { title: string } | { title: string; salary: string };
    export type RolesIndexSalaryRemainders = { salary: string };

    type RolesIndexRemainingFacets<T extends RolesIndex> = 
        Omit<RolesIndexFacets, keyof T> extends RolesIndexTitleRemainders ? Required<RolesIndexTitleRemainders> :
        Omit<RolesIndexFacets, keyof T> extends RolesIndexSalaryRemainders ? Required<RolesIndexSalaryRemainders> :
        never;

    export type RolesIndexPK = { title: string };

    export type RolesIndexSK = { salary: string };

    export type DirectReportsIndexFacets = {
        manager: string;
        team: TeamEnum;
        office: string;
    }

    export type DirectReportsIndex = { manager: string } | { manager: string; team: TeamEnum } | { manager: string; team: TeamEnum; office: string };
    
    export type DirectReportsIndexManagerRemainders = { manager: string } | { manager: string; team: TeamEnum } | { manager: string; team: TeamEnum; office: string };
    export type DirectReportsIndexTeamRemainders = { team: TeamEnum } | { team: TeamEnum; office: string };
    export type DirectReportsIndexOfficeRemainders = { office: string };

    type DirectReportsIndexRemainingFacets<T extends DirectReportsIndex> = 
        Omit<DirectReportsIndexFacets, keyof T> extends DirectReportsIndexManagerRemainders ? Required<DirectReportsIndexManagerRemainders> :
        Omit<DirectReportsIndexFacets, keyof T> extends DirectReportsIndexTeamRemainders ? Required<DirectReportsIndexTeamRemainders> :
        Omit<DirectReportsIndexFacets, keyof T> extends DirectReportsIndexOfficeRemainders ? Required<DirectReportsIndexOfficeRemainders> :
        never;

    export type DirectReportsIndexPK = { manager: string };

    export type DirectReportsIndexSK = { team: TeamEnum } | { team: TeamEnum; office: string };

    
    export type FilterOperations<T> = {
        gte: (value: T) => string;
        gt: (value: T) => string;
        lte: (value: T) => string;
        lt: (value: T) => string;
        eq: (value: T) => string;
        begins: (value: T) => string;
        exists: () => T;
        notExists: () => T;
        contains: (value: T) => string;
        notContains: (value: T) => string;
        between: (start: T, end: T) => string;
        name: () => T;
        value: (value: T) => string;
    };
    
    export type FilterAttributes<T extends Attributes> = {
        [K in keyof T]: FilterOperations<T[K]>;
    }

    export type GoOptions = {
        params?: object;
        raw?: boolean;
        includeKeys?: boolean;
        originalErr?: boolean;
        lastEvaluatedKeyRaw?: boolean;
    };
    
    export type GoRecord<T> = (options?: GoOptions) => Promise<T>;

    export type PageRecord<T> = (page?: EmployeeIndex | null, options?: GoOptions) => Promise<[EmployeeIndexFacets | null, T]>;

    export type ParamRecord<T = object> = (options?: GoOptions) => T;

    export type FilterRecords<T> = (filter: <A extends Attributes>(record: FilterAttributes<A>) => string) => RecordsActionOptions<T>;

    export type WhereRecords<T> = (where: Where.Callback) => RecordsActionOptions<T>;

    export type RecordsActionOptions<T> = {
        go: GoRecord<T>;
        params: ParamRecord;
        page: PageRecord<T>;
        filter: FilterRecords<T>;
        where: WhereRecords<T>;
    }

    export type SingleRecordOperationOptions<T, P = object> = {
        go: GoRecord<T>;
        params: ParamRecord<P>;
        where: WhereRecords<T>;
    };
    
    export type SetRecordActionOptions<T> = {
        go: GoRecord<T>;
        params: ParamRecord;
        filter: FilterRecords<T>;
        page: PageRecord<T>;
        set: SetRecord<T>;
        where: WhereRecords<T>;
    }
    
    export type SetRecord<T> = (properties: Partial<NonReadOnlyProperties>) => SetRecordActionOptions<T>;
    
    export type QueryOperations<T> = {
        between: (skFacetsStart: T, skFacetsEnd: T) => RecordsActionOptions<Item[]>;
        gt: (skFacets: T) => RecordsActionOptions<Item[]>;
        gte: (skFacets: T) => RecordsActionOptions<Item[]>;
        lt: (skFacets: T) => RecordsActionOptions<Item[]>;
        lte: (skFacets: T) => RecordsActionOptions<Item[]>;
        begins: (skFacets: T) => RecordsActionOptions<Item[]>;
        go: GoRecord<Item[]>;
        params: ParamRecord;
        page: PageRecord<Item[]>;
        filter: FilterRecords<Item[]>;
        where: WhereRecords<Item[]>;
    }
    
    export class Employees {
        get(key: EmployeeIndexFacets): SingleRecordOperationOptions<Item>;
        get(key: EmployeeIndexFacets[]): SingleRecordOperationOptions<[Item[], EmployeeIndexFacets[]], object[]>;
        delete(key: EmployeeIndexFacets): SingleRecordOperationOptions<Item>;
        delete(key: EmployeeIndexFacets[]): SingleRecordOperationOptions<EmployeeIndexFacets[], object[]>;
        update(key: EmployeeIndexFacets): {set: SetRecord<Item>};
        patch(key: EmployeeIndexFacets): {set: SetRecord<Item>};
        put(record: Item): SingleRecordOperationOptions<Item>;
        put(record: Item[]): SingleRecordOperationOptions<Item[], object[]>;
        create(record: Item): SingleRecordOperationOptions<Item>;
        find(record: Partial<Item>): RecordsActionOptions<Item[]>;
        setIdentifier(type: "model" | "table", value: string): void;
        scan: RecordsActionOptions<Item[]>
        query: {
            employee(key: EmployeeIndex): RecordsActionOptions<Item[]>;
            coworkers<T extends CoworkersIndex>(key: T): QueryOperations<CoworkersIndexRemainingFacets<T>>;
            teams<T extends TeamsIndex>(key: T): QueryOperations<TeamsIndexRemainingFacets<T>>;
            employeeLookup(key: EmployeeLookupIndex): RecordsActionOptions<Item[]>;
            roles<T extends RolesIndex>(key: T): QueryOperations<RolesIndexRemainingFacets<T>>;
            directReports<T extends DirectReportsIndex>(key: T): QueryOperations<DirectReportsIndexRemainingFacets<T>>;
        };
        model: {"modelVersion":"v1","service":"taskapp","version":"1","entity":"employees","table":"electro","schema":{"attributes":{"employee":{"name":"employee","field":"employee","readOnly":true,"required":false,"indexes":[{"index":"","name":"employee","type":"pk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":""}],"type":"string","enumArray":[]},"firstName":{"name":"firstName","field":"firstName","readOnly":false,"required":true,"indexes":[],"type":"string","enumArray":[]},"lastName":{"name":"lastName","field":"lastName","readOnly":false,"required":true,"indexes":[],"type":"string","enumArray":[]},"office":{"name":"office","field":"office","readOnly":false,"required":true,"indexes":[{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":"team"},{"index":"gsi5pk-gsi5sk-index","name":"office","type":"sk","next":""}],"type":"string","enumArray":[]},"title":{"name":"title","field":"title","readOnly":false,"required":true,"indexes":[{"index":"gsi1pk-gsi1sk-index","name":"title","type":"sk","next":"employee"},{"index":"gsi2pk-gsi2sk-index","name":"title","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"title","type":"pk","next":"salary"}],"type":"string","enumArray":[]},"team":{"name":"team","field":"team","readOnly":false,"required":true,"indexes":[{"index":"gsi1pk-gsi1sk-index","name":"team","type":"sk","next":"title"},{"index":"gsi2pk-gsi2sk-index","name":"team","type":"pk","next":"dateHired"},{"index":"gsi5pk-gsi5sk-index","name":"team","type":"sk","next":"office"}],"type":"enum","enumArray":["development","marketing","finance","product","cool cats and kittens"]},"salary":{"name":"salary","field":"salary","readOnly":false,"required":true,"indexes":[{"index":"gsi4pk-gsi4sk-index","name":"salary","type":"sk","next":""}],"type":"string","enumArray":[]},"manager":{"name":"manager","field":"manager","readOnly":false,"required":false,"indexes":[{"index":"gsi5pk-gsi5sk-index","name":"manager","type":"pk","next":"team"}],"type":"string","enumArray":[]},"dateHired":{"name":"dateHired","field":"dateHired","readOnly":false,"required":false,"indexes":[{"index":"gsi2pk-gsi2sk-index","name":"dateHired","type":"sk","next":"title"}],"type":"string","enumArray":[]},"birthday":{"name":"birthday","field":"birthday","readOnly":false,"required":false,"indexes":[],"type":"string","enumArray":[]}},"enums":{},"translationForTable":{"employee":"employee","firstName":"firstName","lastName":"lastName","office":"office","title":"title","team":"team","salary":"salary","manager":"manager","dateHired":"dateHired","birthday":"birthday"},"translationForRetrieval":{"employee":"employee","firstName":"firstName","lastName":"lastName","office":"office","title":"title","team":"team","salary":"salary","manager":"manager","dateHired":"dateHired","birthday":"birthday"}},"facets":{"byIndex":{"":{"customFacets":{"pk":false,"sk":false},"pk":["employee"],"sk":[],"all":[{"name":"employee","index":"","type":"pk"}]},"gsi1pk-gsi1sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["office"],"sk":["team","title","employee"],"all":[{"name":"office","index":"gsi1pk-gsi1sk-index","type":"pk"},{"name":"team","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"title","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"employee","index":"gsi1pk-gsi1sk-index","type":"sk"}],"collection":"workplaces"},"gsi2pk-gsi2sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["team"],"sk":["dateHired","title"],"all":[{"name":"team","index":"gsi2pk-gsi2sk-index","type":"pk"},{"name":"dateHired","index":"gsi2pk-gsi2sk-index","type":"sk"},{"name":"title","index":"gsi2pk-gsi2sk-index","type":"sk"}]},"gsi3pk-gsi3sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["employee"],"sk":[],"all":[{"name":"employee","index":"gsi3pk-gsi3sk-index","type":"pk"}],"collection":"assignments"},"gsi4pk-gsi4sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["title"],"sk":["salary"],"all":[{"name":"title","index":"gsi4pk-gsi4sk-index","type":"pk"},{"name":"salary","index":"gsi4pk-gsi4sk-index","type":"sk"}]},"gsi5pk-gsi5sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["manager"],"sk":["team","office"],"all":[{"name":"manager","index":"gsi5pk-gsi5sk-index","type":"pk"},{"name":"team","index":"gsi5pk-gsi5sk-index","type":"sk"},{"name":"office","index":"gsi5pk-gsi5sk-index","type":"sk"}]}},"byFacet":{"employee":[[{"index":"","name":"employee","type":"pk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":""}],null,null,[{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":""}]],"office":[[{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":"team"}],null,[{"index":"gsi5pk-gsi5sk-index","name":"office","type":"sk","next":""}]],"team":[[{"index":"gsi2pk-gsi2sk-index","name":"team","type":"pk","next":"dateHired"}],[{"index":"gsi1pk-gsi1sk-index","name":"team","type":"sk","next":"title"},{"index":"gsi5pk-gsi5sk-index","name":"team","type":"sk","next":"office"}]],"title":[[{"index":"gsi4pk-gsi4sk-index","name":"title","type":"pk","next":"salary"}],null,[{"index":"gsi1pk-gsi1sk-index","name":"title","type":"sk","next":"employee"},{"index":"gsi2pk-gsi2sk-index","name":"title","type":"sk","next":""}]],"dateHired":[null,[{"index":"gsi2pk-gsi2sk-index","name":"dateHired","type":"sk","next":"title"}]],"salary":[null,[{"index":"gsi4pk-gsi4sk-index","name":"salary","type":"sk","next":""}]],"manager":[[{"index":"gsi5pk-gsi5sk-index","name":"manager","type":"pk","next":"team"}]]},"byAttr":{"employee":[{"index":"","name":"employee","type":"pk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":""}],"office":[{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":"team"},{"index":"gsi5pk-gsi5sk-index","name":"office","type":"sk","next":""}],"team":[{"index":"gsi1pk-gsi1sk-index","name":"team","type":"sk","next":"title"},{"index":"gsi2pk-gsi2sk-index","name":"team","type":"pk","next":"dateHired"},{"index":"gsi5pk-gsi5sk-index","name":"team","type":"sk","next":"office"}],"title":[{"index":"gsi1pk-gsi1sk-index","name":"title","type":"sk","next":"employee"},{"index":"gsi2pk-gsi2sk-index","name":"title","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"title","type":"pk","next":"salary"}],"dateHired":[{"index":"gsi2pk-gsi2sk-index","name":"dateHired","type":"sk","next":"title"}],"salary":[{"index":"gsi4pk-gsi4sk-index","name":"salary","type":"sk","next":""}],"manager":[{"index":"gsi5pk-gsi5sk-index","name":"manager","type":"pk","next":"team"}]},"byType":{"pk":[{"index":"","name":"employee","type":"pk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":"team"},{"index":"gsi2pk-gsi2sk-index","name":"team","type":"pk","next":"dateHired"},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"title","type":"pk","next":"salary"},{"index":"gsi5pk-gsi5sk-index","name":"manager","type":"pk","next":"team"}],"sk":[{"index":"gsi1pk-gsi1sk-index","name":"team","type":"sk","next":"title"},{"index":"gsi1pk-gsi1sk-index","name":"title","type":"sk","next":"employee"},{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":""},{"index":"gsi2pk-gsi2sk-index","name":"dateHired","type":"sk","next":"title"},{"index":"gsi2pk-gsi2sk-index","name":"title","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"salary","type":"sk","next":""},{"index":"gsi5pk-gsi5sk-index","name":"team","type":"sk","next":"office"},{"index":"gsi5pk-gsi5sk-index","name":"office","type":"sk","next":""}]},"bySlot":[[{"index":"","name":"employee","type":"pk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":"team"},{"index":"gsi2pk-gsi2sk-index","name":"team","type":"pk","next":"dateHired"},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"title","type":"pk","next":"salary"},{"index":"gsi5pk-gsi5sk-index","name":"manager","type":"pk","next":"team"}],[null,{"index":"gsi1pk-gsi1sk-index","name":"team","type":"sk","next":"title"},{"index":"gsi2pk-gsi2sk-index","name":"dateHired","type":"sk","next":"title"},null,{"index":"gsi4pk-gsi4sk-index","name":"salary","type":"sk","next":""},{"index":"gsi5pk-gsi5sk-index","name":"team","type":"sk","next":"office"}],[null,{"index":"gsi1pk-gsi1sk-index","name":"title","type":"sk","next":"employee"},{"index":"gsi2pk-gsi2sk-index","name":"title","type":"sk","next":""},null,null,{"index":"gsi5pk-gsi5sk-index","name":"office","type":"sk","next":""}],[null,{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":""}]],"fields":["sk","pk","gsi1sk","gsi1pk","gsi2sk","gsi2pk","gsi3sk","gsi3pk","gsi4sk","gsi4pk","gsi5sk","gsi5pk"],"attributes":[{"name":"employee","index":"","type":"pk"},{"name":"office","index":"gsi1pk-gsi1sk-index","type":"pk"},{"name":"team","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"title","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"employee","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"team","index":"gsi2pk-gsi2sk-index","type":"pk"},{"name":"dateHired","index":"gsi2pk-gsi2sk-index","type":"sk"},{"name":"title","index":"gsi2pk-gsi2sk-index","type":"sk"},{"name":"employee","index":"gsi3pk-gsi3sk-index","type":"pk"},{"name":"title","index":"gsi4pk-gsi4sk-index","type":"pk"},{"name":"salary","index":"gsi4pk-gsi4sk-index","type":"sk"},{"name":"manager","index":"gsi5pk-gsi5sk-index","type":"pk"},{"name":"team","index":"gsi5pk-gsi5sk-index","type":"sk"},{"name":"office","index":"gsi5pk-gsi5sk-index","type":"sk"}],"labels":{"":{},"gsi1pk-gsi1sk-index":{},"gsi2pk-gsi2sk-index":{},"gsi3pk-gsi3sk-index":{},"gsi4pk-gsi4sk-index":{},"gsi5pk-gsi5sk-index":{}}},"indexes":{"employee":{"pk":{"accessPattern":"employee","facetLabels":{},"index":"","type":"pk","field":"pk","facets":["employee"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"employee","index":"","type":"sk","field":"sk","facets":[],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":""},"coworkers":{"pk":{"accessPattern":"coworkers","facetLabels":{},"index":"gsi1pk-gsi1sk-index","type":"pk","field":"gsi1pk","facets":["office"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"coworkers","index":"gsi1pk-gsi1sk-index","type":"sk","field":"gsi1sk","facets":["team","title","employee"],"isCustom":false},"collection":"workplaces","customFacets":{"pk":false,"sk":false},"index":"gsi1pk-gsi1sk-index"},"teams":{"pk":{"accessPattern":"teams","facetLabels":{},"index":"gsi2pk-gsi2sk-index","type":"pk","field":"gsi2pk","facets":["team"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"teams","index":"gsi2pk-gsi2sk-index","type":"sk","field":"gsi2sk","facets":["dateHired","title"],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":"gsi2pk-gsi2sk-index"},"employeeLookup":{"pk":{"accessPattern":"employeeLookup","facetLabels":{},"index":"gsi3pk-gsi3sk-index","type":"pk","field":"gsi3pk","facets":["employee"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"employeeLookup","index":"gsi3pk-gsi3sk-index","type":"sk","field":"gsi3sk","facets":[],"isCustom":false},"collection":"assignments","customFacets":{"pk":false,"sk":false},"index":"gsi3pk-gsi3sk-index"},"roles":{"pk":{"accessPattern":"roles","facetLabels":{},"index":"gsi4pk-gsi4sk-index","type":"pk","field":"gsi4pk","facets":["title"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"roles","index":"gsi4pk-gsi4sk-index","type":"sk","field":"gsi4sk","facets":["salary"],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":"gsi4pk-gsi4sk-index"},"directReports":{"pk":{"accessPattern":"directReports","facetLabels":{},"index":"gsi5pk-gsi5sk-index","type":"pk","field":"gsi5pk","facets":["manager"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"directReports","index":"gsi5pk-gsi5sk-index","type":"sk","field":"gsi5sk","facets":["team","office"],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":"gsi5pk-gsi5sk-index"}},"filters":{},"prefixes":{"":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$employees_1","isCustom":false}},"gsi1pk-gsi1sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$workplaces#employees_1","isCustom":false}},"gsi2pk-gsi2sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$employees_1","isCustom":false}},"gsi3pk-gsi3sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$assignments#employees_1","isCustom":false}},"gsi4pk-gsi4sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$employees_1","isCustom":false}},"gsi5pk-gsi5sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$employees_1","isCustom":false}}},"collections":["workplaces","assignments"],"lookup":{"indexHasSortKeys":{"":true,"gsi1pk-gsi1sk-index":true,"gsi2pk-gsi2sk-index":true,"gsi3pk-gsi3sk-index":true,"gsi4pk-gsi4sk-index":true,"gsi5pk-gsi5sk-index":true}},"translations":{"keys":{"":{"pk":"pk","sk":"sk"},"gsi1pk-gsi1sk-index":{"pk":"gsi1pk","sk":"gsi1sk"},"gsi2pk-gsi2sk-index":{"pk":"gsi2pk","sk":"gsi2sk"},"gsi3pk-gsi3sk-index":{"pk":"gsi3pk","sk":"gsi3sk"},"gsi4pk-gsi4sk-index":{"pk":"gsi4pk","sk":"gsi4sk"},"gsi5pk-gsi5sk-index":{"pk":"gsi5pk","sk":"gsi5sk"}},"indexes":{"fromAccessPatternToIndex":{"employee":"","coworkers":"gsi1pk-gsi1sk-index","teams":"gsi2pk-gsi2sk-index","employeeLookup":"gsi3pk-gsi3sk-index","roles":"gsi4pk-gsi4sk-index","directReports":"gsi5pk-gsi5sk-index"},"fromIndexToAccessPattern":{"":"employee","gsi1pk-gsi1sk-index":"coworkers","gsi2pk-gsi2sk-index":"teams","gsi3pk-gsi3sk-index":"employeeLookup","gsi4pk-gsi4sk-index":"roles","gsi5pk-gsi5sk-index":"directReports"}},"collections":{"fromCollectionToIndex":{"workplaces":"gsi1pk-gsi1sk-index","assignments":"gsi3pk-gsi3sk-index"},"fromIndexToCollection":{"gsi1pk-gsi1sk-index":"workplaces","gsi3pk-gsi3sk-index":"assignments"}}},"original":{"model":{"entity":"employees","version":"1","service":"taskapp"},"attributes":{"employee":{"type":"string"},"firstName":{"type":"string","required":true},"lastName":{"type":"string","required":true},"office":{"type":"string","required":true},"title":{"type":"string","required":true},"team":{"type":["development","marketing","finance","product","cool cats and kittens"],"required":true},"salary":{"type":"string","required":true},"manager":{"type":"string"},"dateHired":{"type":"string"},"birthday":{"type":"string"}},"indexes":{"employee":{"pk":{"field":"pk","facets":["employee"]},"sk":{"field":"sk","facets":[]}},"coworkers":{"index":"gsi1pk-gsi1sk-index","collection":"workplaces","pk":{"field":"gsi1pk","facets":["office"]},"sk":{"field":"gsi1sk","facets":["team","title","employee"]}},"teams":{"index":"gsi2pk-gsi2sk-index","pk":{"field":"gsi2pk","facets":["team"]},"sk":{"field":"gsi2sk","facets":["dateHired","title"]}},"employeeLookup":{"collection":"assignments","index":"gsi3pk-gsi3sk-index","pk":{"field":"gsi3pk","facets":["employee"]},"sk":{"field":"gsi3sk","facets":[]}},"roles":{"index":"gsi4pk-gsi4sk-index","pk":{"field":"gsi4pk","facets":["title"]},"sk":{"field":"gsi4sk","facets":["salary"]}},"directReports":{"index":"gsi5pk-gsi5sk-index","pk":{"field":"gsi5pk","facets":["manager"]},"sk":{"field":"gsi5sk","facets":["team","office"]}}}}};
        identifiers: {"entity":"__edb_e__","version":"__edb_v__"};
    }
}

export declare namespace Tasks {
    namespace Where {
        const TaskSymbol: unique symbol;

        const ProjectSymbol: unique symbol;

        const EmployeeSymbol: unique symbol;

        const DescriptionSymbol: unique symbol;

        const StatusSymbol: unique symbol;

        const PointsSymbol: unique symbol;

        const CommentsSymbol: unique symbol;

        interface Task {
            [TaskSymbol]: void;
        }

        interface Project {
            [ProjectSymbol]: void;
        }

        interface Employee {
            [EmployeeSymbol]: void;
        }

        interface Description {
            [DescriptionSymbol]: void;
        }

        interface Status {
            [StatusSymbol]: void;
        }

        interface Points {
            [PointsSymbol]: void;
        }

        interface Comments {
            [CommentsSymbol]: void;
        }

        type AttributeName = Task | Project | Employee | Description | Status | Points | Comments

        type AttributeType<T extends AttributeName> =
            T extends Task ? string :
            T extends Project ? string :
            T extends Employee ? string :
            T extends Description ? string :
            T extends Status ? StatusEnum :
            T extends Points ? number :
            T extends Comments ? any :
            never;
        
        type Operations = {
            eq: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            gt: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            lt: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            gte: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            lte: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            between: <T extends AttributeName>(attr: T, value: AttributeType<T>, value2: AttributeType<T>) => string;
            begins: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            exists: <T extends AttributeName>(attr: T) => string;
            notExists: <T extends AttributeName>(attr: T) => string;
            contains: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            notContains: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            value: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            name: <T extends AttributeName>(attr: T) => string;
        };

        type Attributes = {
            task: Task;
            project: Project;
            employee: Employee;
            description: Description;
            status: Status;
            points: Points;
            comments: Comments;
        }

        type Callback = (attr: Attributes, op: Operations) => string;
    }

    namespace Enums {
        export type StatusEnum = "open" | "in-progress" | "closed";
    }

    export type StatusEnum = "open" | "in-progress" | "closed";

    type TableIndexNames = "pk" | "sk";
    
    export type Item = {
        task: string;
        project: string;
        employee: string;
        description?: string;
        status?: StatusEnum;
        points: number;
        comments?: any;
    }
    
    export type Attributes = {
        task: string;
        project: string;
        employee: string;
        description: string;
        status: StatusEnum;
        points: number;
        comments: any;
    }
    
    export type RawItem = {
        sk: string;
        pk: string;
        gsi1sk: string;
        gsi1pk: string;
        gsi3sk: string;
        gsi3pk: string;
        gsi4sk: string;
        gsi4pk: string;
        task: string;
        project: string;
        employee: string;
        description?: string;
        status?: StatusEnum;
        points: number;
        comments?: any;
    }
    
    export type config = {
        raw?: boolean;
        params?: object;
        includeKeys?: boolean;
        originalErr?: boolean;
    }
    
    export type NonReadOnlyProperties = {
        description?: string;
        status?: StatusEnum;
        points: number;
        comments?: any;
    }
    
    export type TaskIndexFacets = {
        task: string;
        project: string;
        employee: string;
    }

    export type TaskIndex = { task: string } | { task: string; project: string } | { task: string; project: string; employee: string };
    
    export type TaskIndexTaskRemainders = { task: string } | { task: string; project: string } | { task: string; project: string; employee: string };
    export type TaskIndexProjectRemainders = { project: string } | { project: string; employee: string };
    export type TaskIndexEmployeeRemainders = { employee: string };

    type TaskIndexRemainingFacets<T extends TaskIndex> = 
        Omit<TaskIndexFacets, keyof T> extends TaskIndexTaskRemainders ? Required<TaskIndexTaskRemainders> :
        Omit<TaskIndexFacets, keyof T> extends TaskIndexProjectRemainders ? Required<TaskIndexProjectRemainders> :
        Omit<TaskIndexFacets, keyof T> extends TaskIndexEmployeeRemainders ? Required<TaskIndexEmployeeRemainders> :
        never;

    export type ProjectIndexFacets = {
        project: string;
        employee: string;
        status: StatusEnum;
    }

    export type ProjectIndex = { project: string } | { project: string; employee: string } | { project: string; employee: string; status: StatusEnum };
    
    export type ProjectIndexProjectRemainders = { project: string } | { project: string; employee: string } | { project: string; employee: string; status: StatusEnum };
    export type ProjectIndexEmployeeRemainders = { employee: string } | { employee: string; status: StatusEnum };
    export type ProjectIndexStatusRemainders = { status: StatusEnum };

    type ProjectIndexRemainingFacets<T extends ProjectIndex> = 
        Omit<ProjectIndexFacets, keyof T> extends ProjectIndexProjectRemainders ? Required<ProjectIndexProjectRemainders> :
        Omit<ProjectIndexFacets, keyof T> extends ProjectIndexEmployeeRemainders ? Required<ProjectIndexEmployeeRemainders> :
        Omit<ProjectIndexFacets, keyof T> extends ProjectIndexStatusRemainders ? Required<ProjectIndexStatusRemainders> :
        never;

    export type ProjectIndexPK = { project: string };

    export type ProjectIndexSK = { employee: string } | { employee: string; status: StatusEnum };

    export type AssignedIndexFacets = {
        employee: string;
        project: string;
        status: StatusEnum;
    }

    export type AssignedIndex = { employee: string } | { employee: string; project: string } | { employee: string; project: string; status: StatusEnum };
    
    export type AssignedIndexEmployeeRemainders = { employee: string } | { employee: string; project: string } | { employee: string; project: string; status: StatusEnum };
    export type AssignedIndexProjectRemainders = { project: string } | { project: string; status: StatusEnum };
    export type AssignedIndexStatusRemainders = { status: StatusEnum };

    type AssignedIndexRemainingFacets<T extends AssignedIndex> = 
        Omit<AssignedIndexFacets, keyof T> extends AssignedIndexEmployeeRemainders ? Required<AssignedIndexEmployeeRemainders> :
        Omit<AssignedIndexFacets, keyof T> extends AssignedIndexProjectRemainders ? Required<AssignedIndexProjectRemainders> :
        Omit<AssignedIndexFacets, keyof T> extends AssignedIndexStatusRemainders ? Required<AssignedIndexStatusRemainders> :
        never;

    export type AssignedIndexPK = { employee: string };

    export type AssignedIndexSK = { project: string } | { project: string; status: StatusEnum };

    export type StatusesIndexFacets = {
        status: StatusEnum;
        project: string;
        employee: string;
    }

    export type StatusesIndex = { status: StatusEnum } | { status: StatusEnum; project: string } | { status: StatusEnum; project: string; employee: string };
    
    export type StatusesIndexStatusRemainders = { status: StatusEnum } | { status: StatusEnum; project: string } | { status: StatusEnum; project: string; employee: string };
    export type StatusesIndexProjectRemainders = { project: string } | { project: string; employee: string };
    export type StatusesIndexEmployeeRemainders = { employee: string };

    type StatusesIndexRemainingFacets<T extends StatusesIndex> = 
        Omit<StatusesIndexFacets, keyof T> extends StatusesIndexStatusRemainders ? Required<StatusesIndexStatusRemainders> :
        Omit<StatusesIndexFacets, keyof T> extends StatusesIndexProjectRemainders ? Required<StatusesIndexProjectRemainders> :
        Omit<StatusesIndexFacets, keyof T> extends StatusesIndexEmployeeRemainders ? Required<StatusesIndexEmployeeRemainders> :
        never;

    export type StatusesIndexPK = { status: StatusEnum };

    export type StatusesIndexSK = { project: string } | { project: string; employee: string };

    
    export type FilterOperations<T> = {
        gte: (value: T) => string;
        gt: (value: T) => string;
        lte: (value: T) => string;
        lt: (value: T) => string;
        eq: (value: T) => string;
        begins: (value: T) => string;
        exists: () => T;
        notExists: () => T;
        contains: (value: T) => string;
        notContains: (value: T) => string;
        between: (start: T, end: T) => string;
        name: () => T;
        value: (value: T) => string;
    };
    
    export type FilterAttributes<T extends Attributes> = {
        [K in keyof T]: FilterOperations<T[K]>;
    }

    export type GoOptions = {
        params?: object;
        raw?: boolean;
        includeKeys?: boolean;
        originalErr?: boolean;
        lastEvaluatedKeyRaw?: boolean;
    };
    
    export type GoRecord<T> = (options?: GoOptions) => Promise<T>;

    export type PageRecord<T> = (page?: TaskIndex | null, options?: GoOptions) => Promise<[TaskIndexFacets | null, T]>;

    export type ParamRecord<T = object> = (options?: GoOptions) => T;

    export type FilterRecords<T> = (filter: <A extends Attributes>(record: FilterAttributes<A>) => string) => RecordsActionOptions<T>;

    export type WhereRecords<T> = (where: Where.Callback) => RecordsActionOptions<T>;

    export type RecordsActionOptions<T> = {
        go: GoRecord<T>;
        params: ParamRecord;
        page: PageRecord<T>;
        filter: FilterRecords<T>;
        where: WhereRecords<T>;
    }

    export type SingleRecordOperationOptions<T, P = object> = {
        go: GoRecord<T>;
        params: ParamRecord<P>;
        where: WhereRecords<T>;
    };
    
    export type SetRecordActionOptions<T> = {
        go: GoRecord<T>;
        params: ParamRecord;
        filter: FilterRecords<T>;
        page: PageRecord<T>;
        set: SetRecord<T>;
        where: WhereRecords<T>;
    }
    
    export type SetRecord<T> = (properties: Partial<NonReadOnlyProperties>) => SetRecordActionOptions<T>;
    
    export type QueryOperations<T> = {
        between: (skFacetsStart: T, skFacetsEnd: T) => RecordsActionOptions<Item[]>;
        gt: (skFacets: T) => RecordsActionOptions<Item[]>;
        gte: (skFacets: T) => RecordsActionOptions<Item[]>;
        lt: (skFacets: T) => RecordsActionOptions<Item[]>;
        lte: (skFacets: T) => RecordsActionOptions<Item[]>;
        begins: (skFacets: T) => RecordsActionOptions<Item[]>;
        go: GoRecord<Item[]>;
        params: ParamRecord;
        page: PageRecord<Item[]>;
        filter: FilterRecords<Item[]>;
        where: WhereRecords<Item[]>;
    }
    
    export class Tasks {
        get(key: TaskIndexFacets): SingleRecordOperationOptions<Item>;
        get(key: TaskIndexFacets[]): SingleRecordOperationOptions<[Item[], TaskIndexFacets[]], object[]>;
        delete(key: TaskIndexFacets): SingleRecordOperationOptions<Item>;
        delete(key: TaskIndexFacets[]): SingleRecordOperationOptions<TaskIndexFacets[], object[]>;
        update(key: TaskIndexFacets): {set: SetRecord<Item>};
        patch(key: TaskIndexFacets): {set: SetRecord<Item>};
        put(record: Item): SingleRecordOperationOptions<Item>;
        put(record: Item[]): SingleRecordOperationOptions<Item[], object[]>;
        create(record: Item): SingleRecordOperationOptions<Item>;
        find(record: Partial<Item>): RecordsActionOptions<Item[]>;
        setIdentifier(type: "model" | "table", value: string): void;
        scan: RecordsActionOptions<Item[]>
        query: {
            task<T extends TaskIndex>(key: T): QueryOperations<TaskIndexRemainingFacets<T>>;
            project<T extends ProjectIndex>(key: T): QueryOperations<ProjectIndexRemainingFacets<T>>;
            assigned<T extends AssignedIndex>(key: T): QueryOperations<AssignedIndexRemainingFacets<T>>;
            statuses<T extends StatusesIndex>(key: T): QueryOperations<StatusesIndexRemainingFacets<T>>;
        };
        model: {"modelVersion":"v1","service":"taskapp","version":"1","entity":"tasks","table":"electro","schema":{"attributes":{"task":{"name":"task","field":"task","readOnly":true,"required":true,"indexes":[{"index":"","name":"task","type":"pk","next":"project"}],"type":"string","enumArray":[]},"project":{"name":"project","field":"project","readOnly":true,"required":true,"indexes":[{"index":"","name":"project","type":"sk","next":"employee"},{"index":"gsi1pk-gsi1sk-index","name":"project","type":"pk","next":"employee"},{"index":"gsi3pk-gsi3sk-index","name":"project","type":"sk","next":"status"},{"index":"gsi4pk-gsi4sk-index","name":"project","type":"sk","next":"employee"}],"type":"string","enumArray":[]},"employee":{"name":"employee","field":"employee","readOnly":true,"required":true,"indexes":[{"index":"","name":"employee","type":"sk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":"status"},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":"project"},{"index":"gsi4pk-gsi4sk-index","name":"employee","type":"sk","next":""}],"type":"string","enumArray":[]},"description":{"name":"description","field":"description","readOnly":false,"required":false,"indexes":[],"type":"string","enumArray":[]},"status":{"name":"status","field":"status","readOnly":false,"required":false,"indexes":[{"index":"gsi1pk-gsi1sk-index","name":"status","type":"sk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"status","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"status","type":"pk","next":"project"}],"type":"enum","enumArray":["open","in-progress","closed"]},"points":{"name":"points","field":"points","readOnly":false,"required":true,"indexes":[],"type":"number","enumArray":[]},"comments":{"name":"comments","field":"comments","readOnly":false,"required":false,"indexes":[],"type":"any","enumArray":[]}},"enums":{},"translationForTable":{"task":"task","project":"project","employee":"employee","description":"description","status":"status","points":"points","comments":"comments"},"translationForRetrieval":{"task":"task","project":"project","employee":"employee","description":"description","status":"status","points":"points","comments":"comments"}},"facets":{"byIndex":{"":{"customFacets":{"pk":false,"sk":false},"pk":["task"],"sk":["project","employee"],"all":[{"name":"task","index":"","type":"pk"},{"name":"project","index":"","type":"sk"},{"name":"employee","index":"","type":"sk"}]},"gsi1pk-gsi1sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["project"],"sk":["employee","status"],"all":[{"name":"project","index":"gsi1pk-gsi1sk-index","type":"pk"},{"name":"employee","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"status","index":"gsi1pk-gsi1sk-index","type":"sk"}]},"gsi3pk-gsi3sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["employee"],"sk":["project","status"],"all":[{"name":"employee","index":"gsi3pk-gsi3sk-index","type":"pk"},{"name":"project","index":"gsi3pk-gsi3sk-index","type":"sk"},{"name":"status","index":"gsi3pk-gsi3sk-index","type":"sk"}],"collection":"assignments"},"gsi4pk-gsi4sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["status"],"sk":["project","employee"],"all":[{"name":"status","index":"gsi4pk-gsi4sk-index","type":"pk"},{"name":"project","index":"gsi4pk-gsi4sk-index","type":"sk"},{"name":"employee","index":"gsi4pk-gsi4sk-index","type":"sk"}]}},"byFacet":{"task":[[{"index":"","name":"task","type":"pk","next":"project"}]],"project":[[{"index":"gsi1pk-gsi1sk-index","name":"project","type":"pk","next":"employee"}],[{"index":"","name":"project","type":"sk","next":"employee"},{"index":"gsi3pk-gsi3sk-index","name":"project","type":"sk","next":"status"},{"index":"gsi4pk-gsi4sk-index","name":"project","type":"sk","next":"employee"}]],"employee":[[{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":"project"}],[{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":"status"}],[{"index":"","name":"employee","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"employee","type":"sk","next":""}]],"status":[[{"index":"gsi4pk-gsi4sk-index","name":"status","type":"pk","next":"project"}],null,[{"index":"gsi1pk-gsi1sk-index","name":"status","type":"sk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"status","type":"sk","next":""}]]},"byAttr":{"task":[{"index":"","name":"task","type":"pk","next":"project"}],"project":[{"index":"","name":"project","type":"sk","next":"employee"},{"index":"gsi1pk-gsi1sk-index","name":"project","type":"pk","next":"employee"},{"index":"gsi3pk-gsi3sk-index","name":"project","type":"sk","next":"status"},{"index":"gsi4pk-gsi4sk-index","name":"project","type":"sk","next":"employee"}],"employee":[{"index":"","name":"employee","type":"sk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":"status"},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":"project"},{"index":"gsi4pk-gsi4sk-index","name":"employee","type":"sk","next":""}],"status":[{"index":"gsi1pk-gsi1sk-index","name":"status","type":"sk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"status","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"status","type":"pk","next":"project"}]},"byType":{"pk":[{"index":"","name":"task","type":"pk","next":"project"},{"index":"gsi1pk-gsi1sk-index","name":"project","type":"pk","next":"employee"},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":"project"},{"index":"gsi4pk-gsi4sk-index","name":"status","type":"pk","next":"project"}],"sk":[{"index":"","name":"project","type":"sk","next":"employee"},{"index":"","name":"employee","type":"sk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":"status"},{"index":"gsi1pk-gsi1sk-index","name":"status","type":"sk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"project","type":"sk","next":"status"},{"index":"gsi3pk-gsi3sk-index","name":"status","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"project","type":"sk","next":"employee"},{"index":"gsi4pk-gsi4sk-index","name":"employee","type":"sk","next":""}]},"bySlot":[[{"index":"","name":"task","type":"pk","next":"project"},{"index":"gsi1pk-gsi1sk-index","name":"project","type":"pk","next":"employee"},{"index":"gsi3pk-gsi3sk-index","name":"employee","type":"pk","next":"project"},{"index":"gsi4pk-gsi4sk-index","name":"status","type":"pk","next":"project"}],[{"index":"","name":"project","type":"sk","next":"employee"},{"index":"gsi1pk-gsi1sk-index","name":"employee","type":"sk","next":"status"},{"index":"gsi3pk-gsi3sk-index","name":"project","type":"sk","next":"status"},{"index":"gsi4pk-gsi4sk-index","name":"project","type":"sk","next":"employee"}],[{"index":"","name":"employee","type":"sk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"status","type":"sk","next":""},{"index":"gsi3pk-gsi3sk-index","name":"status","type":"sk","next":""},{"index":"gsi4pk-gsi4sk-index","name":"employee","type":"sk","next":""}]],"fields":["sk","pk","gsi1sk","gsi1pk","gsi3sk","gsi3pk","gsi4sk","gsi4pk"],"attributes":[{"name":"task","index":"","type":"pk"},{"name":"project","index":"","type":"sk"},{"name":"employee","index":"","type":"sk"},{"name":"project","index":"gsi1pk-gsi1sk-index","type":"pk"},{"name":"employee","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"status","index":"gsi1pk-gsi1sk-index","type":"sk"},{"name":"employee","index":"gsi3pk-gsi3sk-index","type":"pk"},{"name":"project","index":"gsi3pk-gsi3sk-index","type":"sk"},{"name":"status","index":"gsi3pk-gsi3sk-index","type":"sk"},{"name":"status","index":"gsi4pk-gsi4sk-index","type":"pk"},{"name":"project","index":"gsi4pk-gsi4sk-index","type":"sk"},{"name":"employee","index":"gsi4pk-gsi4sk-index","type":"sk"}],"labels":{"":{},"gsi1pk-gsi1sk-index":{},"gsi3pk-gsi3sk-index":{},"gsi4pk-gsi4sk-index":{}}},"indexes":{"task":{"pk":{"accessPattern":"task","facetLabels":{},"index":"","type":"pk","field":"pk","facets":["task"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"task","index":"","type":"sk","field":"sk","facets":["project","employee"],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":""},"project":{"pk":{"accessPattern":"project","facetLabels":{},"index":"gsi1pk-gsi1sk-index","type":"pk","field":"gsi1pk","facets":["project"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"project","index":"gsi1pk-gsi1sk-index","type":"sk","field":"gsi1sk","facets":["employee","status"],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":"gsi1pk-gsi1sk-index"},"assigned":{"pk":{"accessPattern":"assigned","facetLabels":{},"index":"gsi3pk-gsi3sk-index","type":"pk","field":"gsi3pk","facets":["employee"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"assigned","index":"gsi3pk-gsi3sk-index","type":"sk","field":"gsi3sk","facets":["project","status"],"isCustom":false},"collection":"assignments","customFacets":{"pk":false,"sk":false},"index":"gsi3pk-gsi3sk-index"},"statuses":{"pk":{"accessPattern":"statuses","facetLabels":{},"index":"gsi4pk-gsi4sk-index","type":"pk","field":"gsi4pk","facets":["status"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"statuses","index":"gsi4pk-gsi4sk-index","type":"sk","field":"gsi4sk","facets":["project","employee"],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":"gsi4pk-gsi4sk-index"}},"filters":{},"prefixes":{"":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$tasks_1","isCustom":false}},"gsi1pk-gsi1sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$tasks_1","isCustom":false}},"gsi3pk-gsi3sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$assignments#tasks_1","isCustom":false}},"gsi4pk-gsi4sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$tasks_1","isCustom":false}}},"collections":["assignments"],"lookup":{"indexHasSortKeys":{"":true,"gsi1pk-gsi1sk-index":true,"gsi3pk-gsi3sk-index":true,"gsi4pk-gsi4sk-index":true}},"translations":{"keys":{"":{"pk":"pk","sk":"sk"},"gsi1pk-gsi1sk-index":{"pk":"gsi1pk","sk":"gsi1sk"},"gsi3pk-gsi3sk-index":{"pk":"gsi3pk","sk":"gsi3sk"},"gsi4pk-gsi4sk-index":{"pk":"gsi4pk","sk":"gsi4sk"}},"indexes":{"fromAccessPatternToIndex":{"task":"","project":"gsi1pk-gsi1sk-index","assigned":"gsi3pk-gsi3sk-index","statuses":"gsi4pk-gsi4sk-index"},"fromIndexToAccessPattern":{"":"task","gsi1pk-gsi1sk-index":"project","gsi3pk-gsi3sk-index":"assigned","gsi4pk-gsi4sk-index":"statuses"}},"collections":{"fromCollectionToIndex":{"assignments":"gsi3pk-gsi3sk-index"},"fromIndexToCollection":{"gsi3pk-gsi3sk-index":"assignments"}}},"original":{"model":{"entity":"tasks","version":"1","service":"taskapp"},"attributes":{"task":{"type":"string","required":true},"project":{"type":"string","required":true},"employee":{"type":"string","required":true},"description":{"type":"string"},"status":{"type":["open","in-progress","closed"],"default":"open"},"points":{"type":"number","required":true},"comments":{"type":"any"}},"indexes":{"task":{"pk":{"field":"pk","facets":["task"]},"sk":{"field":"sk","facets":["project","employee"]}},"project":{"index":"gsi1pk-gsi1sk-index","pk":{"field":"gsi1pk","facets":["project"]},"sk":{"field":"gsi1sk","facets":["employee","status"]}},"assigned":{"collection":"assignments","index":"gsi3pk-gsi3sk-index","pk":{"field":"gsi3pk","facets":["employee"]},"sk":{"field":"gsi3sk","facets":["project","status"]}},"statuses":{"index":"gsi4pk-gsi4sk-index","pk":{"field":"gsi4pk","facets":["status"]},"sk":{"field":"gsi4sk","facets":["project","employee"]}}}}};
        identifiers: {"entity":"__edb_e__","version":"__edb_v__"};
    }
}

export declare namespace Offices {
    namespace Where {
        const OfficeSymbol: unique symbol;

        const CountrySymbol: unique symbol;

        const StateSymbol: unique symbol;

        const CitySymbol: unique symbol;

        const ZipSymbol: unique symbol;

        const AddressSymbol: unique symbol;

        interface Office {
            [OfficeSymbol]: void;
        }

        interface Country {
            [CountrySymbol]: void;
        }

        interface State {
            [StateSymbol]: void;
        }

        interface City {
            [CitySymbol]: void;
        }

        interface Zip {
            [ZipSymbol]: void;
        }

        interface Address {
            [AddressSymbol]: void;
        }

        type AttributeName = Office | Country | State | City | Zip | Address

        type AttributeType<T extends AttributeName> =
            T extends Office ? string :
            T extends Country ? string :
            T extends State ? string :
            T extends City ? string :
            T extends Zip ? string :
            T extends Address ? string :
            never;
        
        type Operations = {
            eq: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            gt: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            lt: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            gte: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            lte: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            between: <T extends AttributeName>(attr: T, value: AttributeType<T>, value2: AttributeType<T>) => string;
            begins: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            exists: <T extends AttributeName>(attr: T) => string;
            notExists: <T extends AttributeName>(attr: T) => string;
            contains: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            notContains: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            value: <T extends AttributeName>(attr: T, value: AttributeType<T>) => string;
            name: <T extends AttributeName>(attr: T) => string;
        };

        type Attributes = {
            office: Office;
            country: Country;
            state: State;
            city: City;
            zip: Zip;
            address: Address;
        }

        type Callback = (attr: Attributes, op: Operations) => string;
    }

    namespace Enums {
    }

    type TableIndexNames = "pk" | "sk";
    
    export type Item = {
        office?: string;
        country?: string;
        state?: string;
        city?: string;
        zip?: string;
        address?: string;
    }
    
    export type Attributes = {
        office: string;
        country: string;
        state: string;
        city: string;
        zip: string;
        address: string;
    }
    
    export type RawItem = {
        sk: string;
        pk: string;
        gsi1sk: string;
        gsi1pk: string;
        office?: string;
        country?: string;
        state?: string;
        city?: string;
        zip?: string;
        address?: string;
    }
    
    export type config = {
        raw?: boolean;
        params?: object;
        includeKeys?: boolean;
        originalErr?: boolean;
    }
    
    export type NonReadOnlyProperties = {
        address?: string;
    }
    
    export type LocationsIndexFacets = {
        country: string;
        state: string;
        city: string;
        zip: string;
        office: string;
    }

    export type LocationsIndex = { country: string; state: string } | { country: string; state: string; city: string } | { country: string; state: string; city: string; zip: string } | { country: string; state: string; city: string; zip: string; office: string };
    
    export type LocationsIndexCountryRemainders = { country: string; state: string } | { country: string; state: string; city: string } | { country: string; state: string; city: string; zip: string } | { country: string; state: string; city: string; zip: string; office: string };
    export type LocationsIndexStateRemainders = { state: string } | { state: string; city: string } | { state: string; city: string; zip: string } | { state: string; city: string; zip: string; office: string };
    export type LocationsIndexCityRemainders = { city: string } | { city: string; zip: string } | { city: string; zip: string; office: string };
    export type LocationsIndexZipRemainders = { zip: string } | { zip: string; office: string };
    export type LocationsIndexOfficeRemainders = { office: string };

    type LocationsIndexRemainingFacets<T extends LocationsIndex> = 
        Omit<LocationsIndexFacets, keyof T> extends LocationsIndexCountryRemainders ? Required<LocationsIndexCountryRemainders> :
        Omit<LocationsIndexFacets, keyof T> extends LocationsIndexStateRemainders ? Required<LocationsIndexStateRemainders> :
        Omit<LocationsIndexFacets, keyof T> extends LocationsIndexCityRemainders ? Required<LocationsIndexCityRemainders> :
        Omit<LocationsIndexFacets, keyof T> extends LocationsIndexZipRemainders ? Required<LocationsIndexZipRemainders> :
        Omit<LocationsIndexFacets, keyof T> extends LocationsIndexOfficeRemainders ? Required<LocationsIndexOfficeRemainders> :
        never;

    export type OfficeIndexFacets = {
        office: string;
    }

    export type OfficeIndex = { office: string };
    
    export type OfficeIndexOfficeRemainders = { office: string };

    type OfficeIndexRemainingFacets<T extends OfficeIndex> = 
        Omit<OfficeIndexFacets, keyof T> extends OfficeIndexOfficeRemainders ? Required<OfficeIndexOfficeRemainders> :
        never;

    export type OfficeIndexPK = { office: string };

    export type OfficeIndexSK = {};

    
    export type FilterOperations<T> = {
        gte: (value: T) => string;
        gt: (value: T) => string;
        lte: (value: T) => string;
        lt: (value: T) => string;
        eq: (value: T) => string;
        begins: (value: T) => string;
        exists: () => T;
        notExists: () => T;
        contains: (value: T) => string;
        notContains: (value: T) => string;
        between: (start: T, end: T) => string;
        name: () => T;
        value: (value: T) => string;
    };
    
    export type FilterAttributes<T extends Attributes> = {
        [K in keyof T]: FilterOperations<T[K]>;
    }

    export type GoOptions = {
        params?: object;
        raw?: boolean;
        includeKeys?: boolean;
        originalErr?: boolean;
        lastEvaluatedKeyRaw?: boolean;
    };
    
    export type GoRecord<T> = (options?: GoOptions) => Promise<T>;

    export type PageRecord<T> = (page?: LocationsIndex | null, options?: GoOptions) => Promise<[LocationsIndexFacets | null, T]>;

    export type ParamRecord<T = object> = (options?: GoOptions) => T;

    export type FilterRecords<T> = (filter: <A extends Attributes>(record: FilterAttributes<A>) => string) => RecordsActionOptions<T>;

    export type WhereRecords<T> = (where: Where.Callback) => RecordsActionOptions<T>;

    export type RecordsActionOptions<T> = {
        go: GoRecord<T>;
        params: ParamRecord;
        page: PageRecord<T>;
        filter: FilterRecords<T>;
        where: WhereRecords<T>;
    }

    export type SingleRecordOperationOptions<T, P = object> = {
        go: GoRecord<T>;
        params: ParamRecord<P>;
        where: WhereRecords<T>;
    };
    
    export type SetRecordActionOptions<T> = {
        go: GoRecord<T>;
        params: ParamRecord;
        filter: FilterRecords<T>;
        page: PageRecord<T>;
        set: SetRecord<T>;
        where: WhereRecords<T>;
    }
    
    export type SetRecord<T> = (properties: Partial<NonReadOnlyProperties>) => SetRecordActionOptions<T>;
    
    export type QueryOperations<T> = {
        between: (skFacetsStart: T, skFacetsEnd: T) => RecordsActionOptions<Item[]>;
        gt: (skFacets: T) => RecordsActionOptions<Item[]>;
        gte: (skFacets: T) => RecordsActionOptions<Item[]>;
        lt: (skFacets: T) => RecordsActionOptions<Item[]>;
        lte: (skFacets: T) => RecordsActionOptions<Item[]>;
        begins: (skFacets: T) => RecordsActionOptions<Item[]>;
        go: GoRecord<Item[]>;
        params: ParamRecord;
        page: PageRecord<Item[]>;
        filter: FilterRecords<Item[]>;
        where: WhereRecords<Item[]>;
    }
    
    export class Offices {
        get(key: LocationsIndexFacets): SingleRecordOperationOptions<Item>;
        get(key: LocationsIndexFacets[]): SingleRecordOperationOptions<[Item[], LocationsIndexFacets[]], object[]>;
        delete(key: LocationsIndexFacets): SingleRecordOperationOptions<Item>;
        delete(key: LocationsIndexFacets[]): SingleRecordOperationOptions<LocationsIndexFacets[], object[]>;
        update(key: LocationsIndexFacets): {set: SetRecord<Item>};
        patch(key: LocationsIndexFacets): {set: SetRecord<Item>};
        put(record: Item): SingleRecordOperationOptions<Item>;
        put(record: Item[]): SingleRecordOperationOptions<Item[], object[]>;
        create(record: Item): SingleRecordOperationOptions<Item>;
        find(record: Partial<Item>): RecordsActionOptions<Item[]>;
        setIdentifier(type: "model" | "table", value: string): void;
        scan: RecordsActionOptions<Item[]>
        query: {
            locations<T extends LocationsIndex>(key: T): QueryOperations<LocationsIndexRemainingFacets<T>>;
            office(key: OfficeIndex): RecordsActionOptions<Item[]>;
        };
        model: {"modelVersion":"v1","service":"taskapp","version":"1","entity":"offices","table":"electro","schema":{"attributes":{"office":{"name":"office","field":"office","readOnly":true,"required":false,"indexes":[{"index":"","name":"office","type":"sk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":""}],"type":"string","enumArray":[]},"country":{"name":"country","field":"country","readOnly":true,"required":false,"indexes":[{"index":"","name":"country","type":"pk","next":"state"}],"type":"string","enumArray":[]},"state":{"name":"state","field":"state","readOnly":true,"required":false,"indexes":[{"index":"","name":"state","type":"pk","next":"city"}],"type":"string","enumArray":[]},"city":{"name":"city","field":"city","readOnly":true,"required":false,"indexes":[{"index":"","name":"city","type":"sk","next":"zip"}],"type":"string","enumArray":[]},"zip":{"name":"zip","field":"zip","readOnly":true,"required":false,"indexes":[{"index":"","name":"zip","type":"sk","next":"office"}],"type":"string","enumArray":[]},"address":{"name":"address","field":"address","readOnly":false,"required":false,"indexes":[],"type":"string","enumArray":[]}},"enums":{},"translationForTable":{"office":"office","country":"country","state":"state","city":"city","zip":"zip","address":"address"},"translationForRetrieval":{"office":"office","country":"country","state":"state","city":"city","zip":"zip","address":"address"}},"facets":{"byIndex":{"":{"customFacets":{"pk":false,"sk":false},"pk":["country","state"],"sk":["city","zip","office"],"all":[{"name":"country","index":"","type":"pk"},{"name":"state","index":"","type":"pk"},{"name":"city","index":"","type":"sk"},{"name":"zip","index":"","type":"sk"},{"name":"office","index":"","type":"sk"}]},"gsi1pk-gsi1sk-index":{"customFacets":{"pk":false,"sk":false},"pk":["office"],"sk":[],"all":[{"name":"office","index":"gsi1pk-gsi1sk-index","type":"pk"}],"collection":"workplaces"}},"byFacet":{"country":[[{"index":"","name":"country","type":"pk","next":"state"}]],"state":[null,[{"index":"","name":"state","type":"pk","next":"city"}]],"city":[null,null,[{"index":"","name":"city","type":"sk","next":"zip"}]],"zip":[null,null,null,[{"index":"","name":"zip","type":"sk","next":"office"}]],"office":[[{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":""}],null,null,null,[{"index":"","name":"office","type":"sk","next":""}]]},"byAttr":{"country":[{"index":"","name":"country","type":"pk","next":"state"}],"state":[{"index":"","name":"state","type":"pk","next":"city"}],"city":[{"index":"","name":"city","type":"sk","next":"zip"}],"zip":[{"index":"","name":"zip","type":"sk","next":"office"}],"office":[{"index":"","name":"office","type":"sk","next":""},{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":""}]},"byType":{"pk":[{"index":"","name":"country","type":"pk","next":"state"},{"index":"","name":"state","type":"pk","next":"city"},{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":""}],"sk":[{"index":"","name":"city","type":"sk","next":"zip"},{"index":"","name":"zip","type":"sk","next":"office"},{"index":"","name":"office","type":"sk","next":""}]},"bySlot":[[{"index":"","name":"country","type":"pk","next":"state"},{"index":"gsi1pk-gsi1sk-index","name":"office","type":"pk","next":""}],[{"index":"","name":"state","type":"pk","next":"city"}],[{"index":"","name":"city","type":"sk","next":"zip"}],[{"index":"","name":"zip","type":"sk","next":"office"}],[{"index":"","name":"office","type":"sk","next":""}]],"fields":["sk","pk","gsi1sk","gsi1pk"],"attributes":[{"name":"country","index":"","type":"pk"},{"name":"state","index":"","type":"pk"},{"name":"city","index":"","type":"sk"},{"name":"zip","index":"","type":"sk"},{"name":"office","index":"","type":"sk"},{"name":"office","index":"gsi1pk-gsi1sk-index","type":"pk"}],"labels":{"":{},"gsi1pk-gsi1sk-index":{}}},"indexes":{"locations":{"pk":{"accessPattern":"locations","facetLabels":{},"index":"","type":"pk","field":"pk","facets":["country","state"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"locations","index":"","type":"sk","field":"sk","facets":["city","zip","office"],"isCustom":false},"collection":"","customFacets":{"pk":false,"sk":false},"index":""},"office":{"pk":{"accessPattern":"office","facetLabels":{},"index":"gsi1pk-gsi1sk-index","type":"pk","field":"gsi1pk","facets":["office"],"isCustom":false},"sk":{"facetLabels":{},"accessPattern":"office","index":"gsi1pk-gsi1sk-index","type":"sk","field":"gsi1sk","facets":[],"isCustom":false},"collection":"workplaces","customFacets":{"pk":false,"sk":false},"index":"gsi1pk-gsi1sk-index"}},"filters":{},"prefixes":{"":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$offices_1","isCustom":false}},"gsi1pk-gsi1sk-index":{"pk":{"prefix":"$taskapp","isCustom":false},"sk":{"prefix":"$workplaces#offices_1","isCustom":false}}},"collections":["workplaces"],"lookup":{"indexHasSortKeys":{"":true,"gsi1pk-gsi1sk-index":true}},"translations":{"keys":{"":{"pk":"pk","sk":"sk"},"gsi1pk-gsi1sk-index":{"pk":"gsi1pk","sk":"gsi1sk"}},"indexes":{"fromAccessPatternToIndex":{"locations":"","office":"gsi1pk-gsi1sk-index"},"fromIndexToAccessPattern":{"":"locations","gsi1pk-gsi1sk-index":"office"}},"collections":{"fromCollectionToIndex":{"workplaces":"gsi1pk-gsi1sk-index"},"fromIndexToCollection":{"gsi1pk-gsi1sk-index":"workplaces"}}},"original":{"model":{"entity":"offices","version":"1","service":"taskapp"},"attributes":{"office":"string","country":"string","state":"string","city":"string","zip":"string","address":"string"},"indexes":{"locations":{"pk":{"field":"pk","facets":["country","state"]},"sk":{"field":"sk","facets":["city","zip","office"]}},"office":{"index":"gsi1pk-gsi1sk-index","collection":"workplaces","pk":{"field":"gsi1pk","facets":["office"]},"sk":{"field":"gsi1sk","facets":[]}}}}};
        identifiers: {"entity":"__edb_e__","version":"__edb_v__"};
    }
}

export declare namespace WorkplacesCollection {
    namespace Where {
        const EmployeeSymbol: unique symbol;

        const FirstNameSymbol: unique symbol;

        const LastNameSymbol: unique symbol;

        const OfficeSymbol: unique symbol;

        const TitleSymbol: unique symbol;

        const TeamSymbol: unique symbol;

        const SalarySymbol: unique symbol;

        const ManagerSymbol: unique symbol;

        const DateHiredSymbol: unique symbol;

        const BirthdaySymbol: unique symbol;

        const CountrySymbol: unique symbol;

        const StateSymbol: unique symbol;

        const CitySymbol: unique symbol;

        const ZipSymbol: unique symbol;

        const AddressSymbol: unique symbol;

        interface Employee {
            [EmployeeSymbol]: void;
        }

        interface FirstName {
            [FirstNameSymbol]: void;
        }

        interface LastName {
            [LastNameSymbol]: void;
        }

        interface Office {
            [OfficeSymbol]: void;
        }

        interface Title {
            [TitleSymbol]: void;
        }

        interface Team {
            [TeamSymbol]: void;
        }

        interface Salary {
            [SalarySymbol]: void;
        }

        interface Manager {
            [ManagerSymbol]: void;
        }

        interface DateHired {
            [DateHiredSymbol]: void;
        }

        interface Birthday {
            [BirthdaySymbol]: void;
        }

        interface Country {
            [CountrySymbol]: void;
        }

        interface State {
            [StateSymbol]: void;
        }

        interface City {
            [CitySymbol]: void;
        }

        interface Zip {
            [ZipSymbol]: void;
        }

        interface Address {
            [AddressSymbol]: void;
        }

        type AttributesName = Employee | FirstName | LastName | Office | Title | Team | Salary | Manager | DateHired | Birthday | Country | State | City | Zip | Address;

        type AttributeType<T extends AttributesName> =
            T extends Employee ? string :
            T extends FirstName ? string :
            T extends LastName ? string :
            T extends Office ? string :
            T extends Title ? string :
            T extends Team ? TeamEnum :
            T extends Salary ? string :
            T extends Manager ? string :
            T extends DateHired ? string :
            T extends Birthday ? string :
            T extends Country ? string :
            T extends State ? string :
            T extends City ? string :
            T extends Zip ? string :
            T extends Address ? string :
            never;
        
        type Operations = {
            eq: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            gt: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            lt: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            gte: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            lte: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            between: <T extends AttributesName>(attr: T, value: AttributeType<T>, value2: AttributeType<T>) => string;
            begins: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            exists: <T extends AttributesName>(attr: T) => string;
            notExists: <T extends AttributesName>(attr: T) => string;
            contains: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            notContains: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            value: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            name: <T extends AttributesName>(attr: T) => string;
        };

        type Attributes = {
            employee: Employee;
            firstName: FirstName;
            lastName: LastName;
            office: Office;
            title: Title;
            team: Team;
            salary: Salary;
            manager: Manager;
            dateHired: DateHired;
            birthday: Birthday;
            country: Country;
            state: State;
            city: City;
            zip: Zip;
            address: Address;
        }

        type Callback = (attr: Attributes, op: Operations) => string;
    }

    type TeamEnum = "development" | "marketing" | "finance" | "product" | "cool cats and kittens";

    type IndexFacets = { office: string } | { office: string; team: TeamEnum } | { office: string; team: TeamEnum; title: string } | { office: string; team: TeamEnum; title: string; employee: string };
    
    type Attributes = {
        employee?: string;
        firstName: string;
        lastName: string;
        office: string;
        title: string;
        team: TeamEnum;
        salary: string;
        manager?: string;
        dateHired?: string;
        birthday?: string;
        country?: string;
        state?: string;
        city?: string;
        zip?: string;
        address?: string;
    }
    
    type EmployeesItem = {
        employee: string;
        firstName: string;
        lastName: string;
        office: string;
        title: string;
        team: TeamEnum;
        salary: string;
        manager: string;
        dateHired: string;
        birthday: string;
    }
    
    type OfficesItem = {
        office: string;
        country: string;
        state: string;
        city: string;
        zip: string;
        address: string;
    }
    
    export type Item = {
        employees: EmployeesItem[];
        offices: OfficesItem[];
    }
    
    type FilterOperations<T> = {
        gte: (value: T) => string;
        gt: (value: T) => string;
        lte: (value: T) => string;
        lt: (value: T) => string;
        eq: (value: T) => string;
        begins: (value: T) => string;
        exists: () => T;
        notExists: () => T;
        contains: (value: T) => string;
        notContains: (value: T) => string;
        between: (start: T, end: T) => string;
        name: () => T;
        value: (value: T) => string;
    };
    
    type FilterAttributes<T extends Attributes> = {
        [K in keyof T]: FilterOperations<T[K]>;
    }

    export type GoOptions = {
        params?: object;
        raw?: boolean;
        includeKeys?: boolean;
        originalErr?: boolean;
        lastEvaluatedKeyRaw?: boolean;
        table?: string;
    };
    
    type GoRecord<T> = (options?: GoOptions) => Promise<T>;

    type ParamRecord = (options?: GoOptions) => object;

    type FilterRecords<T> = (filter: <A extends Attributes>(record: FilterAttributes<A>) => string) => RecordsActionOptions<T>;

    type WhereRecords<T> = (where: Where.Callback) => RecordsActionOptions<T>;

    type RecordsActionOptions<T> = {
        go: GoRecord<T>;
        params: ParamRecord;
        filter: FilterRecords<T>;
        where: WhereRecords<T>;
    }
    
    type Workplaces = (key: IndexFacets) => RecordsActionOptions<Item>;
}

export declare namespace AssignmentsCollection {
    namespace Where {
        const EmployeeSymbol: unique symbol;

        const FirstNameSymbol: unique symbol;

        const LastNameSymbol: unique symbol;

        const OfficeSymbol: unique symbol;

        const TitleSymbol: unique symbol;

        const TeamSymbol: unique symbol;

        const SalarySymbol: unique symbol;

        const ManagerSymbol: unique symbol;

        const DateHiredSymbol: unique symbol;

        const BirthdaySymbol: unique symbol;

        const TaskSymbol: unique symbol;

        const ProjectSymbol: unique symbol;

        const DescriptionSymbol: unique symbol;

        const StatusSymbol: unique symbol;

        const PointsSymbol: unique symbol;

        const CommentsSymbol: unique symbol;

        interface Employee {
            [EmployeeSymbol]: void;
        }

        interface FirstName {
            [FirstNameSymbol]: void;
        }

        interface LastName {
            [LastNameSymbol]: void;
        }

        interface Office {
            [OfficeSymbol]: void;
        }

        interface Title {
            [TitleSymbol]: void;
        }

        interface Team {
            [TeamSymbol]: void;
        }

        interface Salary {
            [SalarySymbol]: void;
        }

        interface Manager {
            [ManagerSymbol]: void;
        }

        interface DateHired {
            [DateHiredSymbol]: void;
        }

        interface Birthday {
            [BirthdaySymbol]: void;
        }

        interface Task {
            [TaskSymbol]: void;
        }

        interface Project {
            [ProjectSymbol]: void;
        }

        interface Description {
            [DescriptionSymbol]: void;
        }

        interface Status {
            [StatusSymbol]: void;
        }

        interface Points {
            [PointsSymbol]: void;
        }

        interface Comments {
            [CommentsSymbol]: void;
        }

        type AttributesName = Employee | FirstName | LastName | Office | Title | Team | Salary | Manager | DateHired | Birthday | Task | Project | Description | Status | Points | Comments;

        type AttributeType<T extends AttributesName> =
            T extends Employee ? string :
            T extends FirstName ? string :
            T extends LastName ? string :
            T extends Office ? string :
            T extends Title ? string :
            T extends Team ? TeamEnum :
            T extends Salary ? string :
            T extends Manager ? string :
            T extends DateHired ? string :
            T extends Birthday ? string :
            T extends Task ? string :
            T extends Project ? string :
            T extends Description ? string :
            T extends Status ? StatusEnum :
            T extends Points ? number :
            T extends Comments ? any :
            never;
        
        type Operations = {
            eq: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            gt: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            lt: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            gte: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            lte: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            between: <T extends AttributesName>(attr: T, value: AttributeType<T>, value2: AttributeType<T>) => string;
            begins: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            exists: <T extends AttributesName>(attr: T) => string;
            notExists: <T extends AttributesName>(attr: T) => string;
            contains: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            notContains: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            value: <T extends AttributesName>(attr: T, value: AttributeType<T>) => string;
            name: <T extends AttributesName>(attr: T) => string;
        };

        type Attributes = {
            employee: Employee;
            firstName: FirstName;
            lastName: LastName;
            office: Office;
            title: Title;
            team: Team;
            salary: Salary;
            manager: Manager;
            dateHired: DateHired;
            birthday: Birthday;
            task: Task;
            project: Project;
            description: Description;
            status: Status;
            points: Points;
            comments: Comments;
        }

        type Callback = (attr: Attributes, op: Operations) => string;
    }

    type TeamEnum = "development" | "marketing" | "finance" | "product" | "cool cats and kittens";

    type StatusEnum = "open" | "in-progress" | "closed";

    type IndexFacets = { employee: string };
    
    type Attributes = {
        employee?: string;
        firstName: string;
        lastName: string;
        office: string;
        title: string;
        team: TeamEnum;
        salary: string;
        manager?: string;
        dateHired?: string;
        birthday?: string;
        task: string;
        project: string;
        description?: string;
        status?: StatusEnum;
        points: number;
        comments?: any;
    }
    
    type EmployeesItem = {
        employee: string;
        firstName: string;
        lastName: string;
        office: string;
        title: string;
        team: TeamEnum;
        salary: string;
        manager: string;
        dateHired: string;
        birthday: string;
    }
    
    type TasksItem = {
        task: string;
        project: string;
        employee: string;
        description: string;
        status: StatusEnum;
        points: number;
        comments: any;
    }
    
    export type Item = {
        employees: EmployeesItem[];
        tasks: TasksItem[];
    }
    
    type FilterOperations<T> = {
        gte: (value: T) => string;
        gt: (value: T) => string;
        lte: (value: T) => string;
        lt: (value: T) => string;
        eq: (value: T) => string;
        begins: (value: T) => string;
        exists: () => T;
        notExists: () => T;
        contains: (value: T) => string;
        notContains: (value: T) => string;
        between: (start: T, end: T) => string;
        name: () => T;
        value: (value: T) => string;
    };
    
    type FilterAttributes<T extends Attributes> = {
        [K in keyof T]: FilterOperations<T[K]>;
    }

    export type GoOptions = {
        params?: object;
        raw?: boolean;
        includeKeys?: boolean;
        originalErr?: boolean;
        lastEvaluatedKeyRaw?: boolean;
        table?: string;
    };
    
    type GoRecord<T> = (options?: GoOptions) => Promise<T>;

    type ParamRecord = (options?: GoOptions) => object;

    type FilterRecords<T> = (filter: <A extends Attributes>(record: FilterAttributes<A>) => string) => RecordsActionOptions<T>;

    type WhereRecords<T> = (where: Where.Callback) => RecordsActionOptions<T>;

    type RecordsActionOptions<T> = {
        go: GoRecord<T>;
        params: ParamRecord;
        filter: FilterRecords<T>;
        where: WhereRecords<T>;
    }
    
    type Assignments = (key: IndexFacets) => RecordsActionOptions<Item>;
}

export declare class Instance {
    service: {
        name: string;
        table: string;
    };
    entities: {
        employees: Employees.Employees, 
        tasks: Tasks.Tasks, 
        offices: Offices.Offices, 
    };
    collections: {
        workplaces: WorkplacesCollection.Workplaces
        assignments: AssignmentsCollection.Assignments
    };
}

declare const _default: Instance;

export default _default;
