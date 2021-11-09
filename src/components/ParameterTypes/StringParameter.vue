<template>
  <div>
    <!-- string single with options available -->
    <v-autocomplete
        v-if="shouldShowStringSingleWithOptions"
        v-model="parameterValue"
        :items="availableOptions"
        :label="parameter.label"
        :search-input.sync="searchInput"
        chips
        deletable-chips
        :hint="parameter.help"
        persistent-hint
        :filter="removeDiacriticsFilter"
    ></v-autocomplete>
    <!-- string multiple with options available -->
    <v-autocomplete
        v-if="shouldShowStringMultipleWithOptions"
        v-model="parameterValue"
        :items="availableOptions"
        :label="parameter.label"
        :search-input.sync="searchInput"
        chips
        deletable-chips
        multiple
        :hint="parameter.help"
        persistent-hint
        :filter="removeDiacriticsFilter"
    >
      <template slot="selection" slot-scope="data">
        <v-chip
            :selected="data.selected"
            :key="JSON.stringify(data.item)"
            close
            class="chip--select-multi"
            @input="data.parent.selectItem(data.item)"
        >{{ data.item }}
        </v-chip>
        <span class="or">or</span>
      </template>
    </v-autocomplete>
    <!-- string multiple -->
    <v-combobox
        v-if="shouldShowStringMultiple"
        v-model="parameterValue"
        :label="parameter.label"
        chips
        deletable-chips
        multiple
        :hint="parameter.help"
        persistent-hint
    >
      <template slot="selection" slot-scope="data">
        <v-chip
            :selected="data.selected"
            :key="JSON.stringify(data.item)"
            close
            class="chip--select-multi"
            @input="data.parent.selectItem(data.item)"
        >{{ data.item }}
        </v-chip>
        <span class="or">or</span>
      </template>
    </v-combobox>
    <!-- string single -->
    <v-text-field
        v-if="shouldShowStringSingle"
        v-model="parameterValue"
        :label="parameter.label"
        :hint="parameter.help"
        persistent-hint
    ></v-text-field>
  </div>
</template>

<script>
import {removeDiacriticsFilter} from "../../helpers";

export default {
  name: "StringParameter",
  props: {
    parameter: Object
  },
  data() {
    return {
      removeDiacriticsFilter,
      searchInput: null,
      searchResults: [],
      fetchedOptions: [],
      isLoading: false,
    };
  },
  created() {
    if (typeof this.parameter.value === "undefined") {
      this.parameterValue = this.parameter.default;
    } else {
      this.parameterValue = this.parameter.value;
    }
  },
  computed: {
    parameterValue: {
      get() {
        return this.$store.getters.parameterValueById(this.parameter.id);
      },
      set(parameterValue) {
        if (parameterValue.length && typeof parameterValue[0] === 'string') {
          this.fetchedOptions = [...parameterValue];
        } else {
          this.fetchedOptions = [];
        }
        const parameterId = this.parameter.id;
        return this.$store.commit("setParameterValue", {
          parameterId,
          parameterValue
        });
      }
    },
    shouldShowStringSingleWithOptions() {
      return this.parameter.type === "string" && (this.isApiSearch || this.availableOptions);
    },
    shouldShowStringMultipleWithOptions() {
      return this.parameter.type === "string_array" && (this.isApiSearch || this.availableOptions);
    },
    shouldShowStringMultiple() {
      return this.parameter.type === "string_array" && !(this.isApiSearch || this.availableOptions);
    },
    shouldShowStringSingle() {
      return this.parameter.type === "string" && !(this.isApiSearch || this.availableOptions);
    },
    availableOptions() {
      if (this.isApiSearch) {
        return [...this.searchResults, ...this.fetchedOptions];
      }
      return this.parameter.available;
    },
    isApiSearch() {
      return !!this.parameter.apiUrl;
    }
  },
  watch: {
    searchInput: function (query) {
      if (!this.isApiSearch) return;

      // Items have already been requested
      if (this.isLoading) return;

      this.isLoading = true;

      // Lazily load input items
      fetch(this.parameter.apiUrl + encodeURI(query), {
        headers: {'Authorization': 'Bearer ' + this.parameter.apiToken}
      })
          .then(res => res.json())
          .then(res => {
            this.searchResults = res.data.map((row) =>
                row.title + ': ' + row.description + ' [ID' + row.id + ']'
            );
          })
          .catch(err => console.log(err))
          .finally(() => this.isLoading = false)
    }
  }
};
</script>

<style scoped lang="scss">
.v-select__selections .or {
  padding: 0 6px 0 3px;
  color: #212121;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;

  &:last-of-type {
    display: none;
  }
}
</style>

