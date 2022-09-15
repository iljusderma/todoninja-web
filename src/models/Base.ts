import { attribute, OpaqueModel, OpaqueTableInterface, OpaqueTable } from '@opaquejs/opaque'
import {
    AttributeOptionsContract,
    ModelAttributes,
    OpaqueAttributes,
    PrimaryKeyValue,
} from '@opaquejs/opaque/lib/contracts/ModelContracts'
import { InMemoryAdapter } from '@opaquejs/opaque/lib/InMemoryAdapter'
import { QueryEngine } from '@opaquejs/query-engine'
import { ComparisonTypes } from '@opaquejs/query'
import { DateTime } from 'luxon'
import { LocalStorageAdapter } from './adapters/LocalStorage'
import { vueModel } from './VueModel'
import { DateTimeComparator } from './extensions/DateTimeComparator'
import { QueryBuilderModifier, QueryBuilderContract } from '@opaquejs/opaque/lib/contracts/QueryBuilderContracts'

export class BaseModel extends vueModel(OpaqueModel) {
    update(data: Partial<ModelAttributes<this>>): Promise<this> {
        if (this.$isPersistent) {
            return this.$setAndSaveAttributes(data)
        }
        return Promise.resolve(this.$setAttributes(data))
    }
    static scope<This extends OpaqueTable>(this: This, modifier: QueryBuilderModifier<QueryBuilderContract<This>>) {
        return modifier
    }
    static async findOrFail(key: PrimaryKeyValue) {
        const result = await this.find(key)
        if (result === undefined) throw new Error(`No ${this.name} with ${this.primaryKey} equals ${key} found!`)
        return result
    }
    is(other: BaseModel) {
        return this.$primaryKeyValue == other.$primaryKeyValue
    }

    $getRow() {
        return Object.getPrototypeOf(this.$attributes.chain)
    }

    clone() {
        const clone = (this.constructor as typeof BaseModel).$fromRow({})
        ;(clone as any).$setRow(this.$getRow(), { raw: true })
        return clone
    }
}

export const queryEngine = new QueryEngine({
    comparators: {
        postponedUntil: (ctx) => new DateTimeComparator(ctx),
        deadlineAt: (ctx) => new DateTimeComparator(ctx),
        doneAt: (ctx) => new DateTimeComparator(ctx),
    },
})

// export const localStorageAdapter = new LocalStorageAdapter(model => new AutoMap(model => new Backend()).get(model))
export const localStorageAdapter = new LocalStorageAdapter(queryEngine)
export const inMemoryAdapter = new InMemoryAdapter(queryEngine)

export function instanceForSource<T extends OpaqueTableInterface>(cls: T) {
    // @ts-ignore
    cls.$instanceForSource = true
    const oldFromRow = cls.$fromRow
    cls.$fromRow = function (data?: OpaqueAttributes) {
        if (data?.__combined_source === true) {
            // @ts-ignore
            return data.model.$fromRow(data.attributes)
        }
        return oldFromRow.call(this, data)
    }
}

export const date = <Type>(options: Partial<AttributeOptionsContract<Type>> = {}) =>
    attribute({
        get: ((value: string) => (value ? DateTime.fromISO(value) : value)) as any,
        set: ((value: DateTime | null) => (value instanceof DateTime ? value.toISODate() : value)) as any,
    })
export const datetime = <Type>(options: Partial<AttributeOptionsContract<Type>> = {}) =>
    attribute({
        get: ((value: string) => (value ? DateTime.fromISO(value) : value)) as any,
        set: ((value: DateTime | null) => (value instanceof DateTime ? value.toISO() : value)) as any,
    })
