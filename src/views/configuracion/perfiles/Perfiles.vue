<template>
    <h3>Pagina Web - Perfiles</h3>

    <div class="card">
        <div class="font-semibold text-xl mb-4">ProgressBar</div>
        <div class="flex flex-col md:flex-row gap-4">
            <div class="md:w-1/2">
                <ProgressBar :value="value"></ProgressBar>
            </div>
            <div class="md:w-1/2">
                <ProgressBar :value="50" :showValue="false"></ProgressBar>
            </div>
        </div>
    </div>

    <div class="flex flex-col md:flex-row gap-8">
        <div class="md:w-1/2">
            <div class="card">
                <div class="font-semibold text-xl mb-4">Badge</div>
                <div class="flex gap-2">
                    <Badge :value="2"></Badge>
                    <Badge :value="8" severity="success"></Badge>
                    <Badge :value="4" severity="info"></Badge>
                    <Badge :value="12" severity="Warn"></Badge>
                    <Badge :value="3" severity="danger"></Badge>
                </div>

                <div class="font-semibold my-4">Overlay</div>
                <div class="flex gap-6">
                    <OverlayBadge value="2">
                        <i class="pi pi-bell" style="font-size: 2rem" />
                    </OverlayBadge>
                    <OverlayBadge value="4" severity="danger">
                        <i class="pi pi-calendar" style="font-size: 2rem" />
                    </OverlayBadge>
                    <OverlayBadge severity="danger">
                        <i class="pi pi-envelope" style="font-size: 2rem" />
                    </OverlayBadge>
                </div>

                <div class="font-semibold my-4">Button</div>
                <div class="flex gap-2">
                    <Button label="Emails" badge="8" class="mr-2"></Button>
                    <Button label="Messages" icon="pi pi-users" severity="warn" badge="8" badgeClass="p-badge-danger"></Button>
                </div>

                <div class="font-semibold my-4">Sizes</div>
                <div class="flex items-start gap-2">
                    <Badge :value="2"></Badge>
                    <Badge :value="4" size="large" severity="warn"></Badge>
                    <Badge :value="6" size="xlarge" severity="success"></Badge>
                </div>
            </div>

            <div class="card">
                <div class="font-semibold text-xl mb-4">Avatar</div>
                <div class="font-semibold mb-4">Group</div>
                <AvatarGroup>
                    <Avatar :image="'https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png'" size="large" shape="circle"></Avatar>
                    <Avatar :image="'https://primefaces.org/cdn/primevue/images/avatar/asiyajavayant.png'" size="large" shape="circle"></Avatar>
                    <Avatar :image="'https://primefaces.org/cdn/primevue/images/avatar/onyamalimba.png'" size="large" shape="circle"></Avatar>
                    <Avatar :image="'https://primefaces.org/cdn/primevue/images/avatar/ionibowcher.png'" size="large" shape="circle"></Avatar>
                    <Avatar :image="'https://primefaces.org/cdn/primevue/images/avatar/xuxuefeng.png'" size="large" shape="circle"></Avatar>
                    <Avatar label="+2" shape="circle" size="large" :style="{ 'background-color': '#9c27b0', color: '#ffffff' }"></Avatar>
                </AvatarGroup>

                <div class="font-semibold my-4">Label - Circle</div>
                <Avatar label="P" class="mr-2" size="xlarge" shape="circle"></Avatar>
                <Avatar label="V" class="mr-2" size="large" :style="{ 'background-color': '#2196F3', color: '#ffffff' }" shape="circle"></Avatar>
                <Avatar label="U" class="mr-2" :style="{ 'background-color': '#9c27b0', color: '#ffffff' }" shape="circle"></Avatar>

                <div class="font-semibold my-4">Icon - Badge</div>
                <OverlayBadge value="4" severity="danger" class="inline-flex">
                    <Avatar label="U" size="xlarge" />
                </OverlayBadge>
            </div>

            <div class="card">
                <div class="font-semibold text-xl mb-4">ScrollTop</div>
                <ScrollPanel :style="{ width: '250px', height: '200px' }">
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae et leo duis ut diam. Ultricies mi quis hendrerit dolor magna eget est lorem. Amet consectetur
                        adipiscing elit ut. Nam libero justo laoreet sit amet. Pharetra massa massa ultricies mi quis hendrerit dolor magna. Est ultricies integer quis auctor elit sed vulputate. Consequat ac felis donec et. Tellus orci ac auctor
                        augue mauris. Semper feugiat nibh sed pulvinar proin gravida hendrerit lectus a. Tincidunt arcu non sodales neque sodales. Metus aliquam eleifend mi in nulla posuere sollicitudin aliquam ultrices. Sodales ut etiam sit amet
                        nisl purus. Cursus sit amet dictum sit amet. Tristique senectus et netus et malesuada fames ac turpis egestas. Et tortor consequat id porta nibh venenatis cras sed. Diam maecenas ultricies mi eget mauris. Eget egestas purus
                        viverra accumsan in nisl nisi. Suscipit adipiscing bibendum est ultricies integer. Mattis aliquam faucibus purus in massa tempor nec.
                    </p>
                    <ScrollTop target="parent" :threshold="100" icon="pi pi-arrow-up"></ScrollTop>
                </ScrollPanel>
            </div>
        </div>
        <div class="md:w-1/2">
            <div class="card">
                <div class="font-semibold text-xl mb-4">Tag</div>
                <div class="font-semibold mb-4">Default</div>
                <div class="flex gap-2">
                    <Tag value="Primary"></Tag>
                    <Tag severity="success" value="Success"></Tag>
                    <Tag severity="info" value="Info"></Tag>
                    <Tag severity="warn" value="Warn"></Tag>
                    <Tag severity="danger" value="Danger"></Tag>
                </div>

                <div class="font-semibold my-4">Pills</div>
                <div class="flex gap-2">
                    <Tag value="Primary" :rounded="true"></Tag>
                    <Tag severity="success" value="Success" :rounded="true"></Tag>
                    <Tag severity="info" value="Info" :rounded="true"></Tag>
                    <Tag severity="warn" value="Warn" :rounded="true"></Tag>
                    <Tag severity="danger" value="Danger" :rounded="true"></Tag>
                </div>

                <div class="font-semibold my-4">Icons</div>
                <div class="flex gap-2">
                    <Tag icon="pi pi-user" value="Primary"></Tag>
                    <Tag icon="pi pi-check" severity="success" value="Success"></Tag>
                    <Tag icon="pi pi-info-circle" severity="info" value="Info"></Tag>
                    <Tag con="pi pi-exclamation-triangle" severity="warn" value="Warn"></Tag>
                    <Tag icon="pi pi-times" severity="danger" value="Danger"></Tag>
                </div>
            </div>

            <div class="card">
                <div class="font-semibold text-xl mb-4">Chip</div>
                <div class="font-semibold mb-4">Basic</div>
                <div class="flex items-center flex-col sm:flex-row">
                    <Chip label="Action" class="mr-2 mb-2"></Chip>
                    <Chip label="Comedy" class="mr-2 mb-2"></Chip>
                    <Chip label="Mystery" class="mr-2 mb-2"></Chip>
                    <Chip label="Thriller" :removable="true" class="mb-2"></Chip>
                </div>

                <div class="font-semibold my-4">Icon</div>
                <div class="flex items-center flex-col sm:flex-row">
                    <Chip label="Apple" icon="pi pi-apple" class="mr-2 mb-2"></Chip>
                    <Chip label="Facebook" icon="pi pi-facebook" class="mr-2 mb-2"></Chip>
                    <Chip label="Google" icon="pi pi-google" class="mr-2 mb-2"></Chip>
                    <Chip label="Microsoft" icon="pi pi-microsoft" :removable="true" class="mb-2"></Chip>
                </div>

                <div class="font-semibold my-4">Image</div>
                <div class="flex items-center flex-col sm:flex-row">
                    <Chip label="Amy Elsner" :image="'https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png'" class="mr-2 mb-2"></Chip>
                    <Chip label="Asiya Javayant" :image="'https://primefaces.org/cdn/primevue/images/avatar/asiyajavayant.png'" class="mr-2 mb-2"></Chip>
                    <Chip label="Onyama Limba" :image="'https://primefaces.org/cdn/primevue/images/avatar/onyamalimba.png'" class="mr-2 mb-2"></Chip>
                </div>
            </div>

            <div class="card">
                <div class="font-semibold text-xl mb-4">Skeleton</div>
                <div class="rounded-border border border-surface p-6">
                    <div class="flex mb-4">
                        <Skeleton shape="circle" size="4rem" class="mr-2"></Skeleton>
                        <div>
                            <Skeleton width="10rem" class="mb-2"></Skeleton>
                            <Skeleton width="5rem" class="mb-2"></Skeleton>
                            <Skeleton height=".5rem"></Skeleton>
                        </div>
                    </div>
                    <Skeleton width="100%" height="150px"></Skeleton>
                    <div class="flex justify-between mt-4">
                        <Skeleton width="4rem" height="2rem"></Skeleton>
                        <Skeleton width="4rem" height="2rem"></Skeleton>
                    </div>
                </div>
            </div>
        </div>
    </div>




<!-- 
    <Fluid class="flex flex-col md:flex-row gap-8">
        <div class="md:w-1/2">
            <div class="card flex flex-col gap-4">
                <div class="font-semibold text-xl">InputText</div>
                <div class="flex flex-col md:flex-row gap-4">
                    <InputText type="text" placeholder="Default" />
                    <InputText type="text" placeholder="Disabled" :disabled="true" />
                    <InputText type="text" placeholder="Invalid" invalid />
                </div>

                <div class="font-semibold text-xl">Icons</div>
                <IconField>
                    <InputIcon class="pi pi-user" />
                    <InputText type="text" placeholder="Username" />
                </IconField>
                <IconField iconPosition="left">
                    <InputText type="text" placeholder="Search" />
                    <InputIcon class="pi pi-search" />
                </IconField>

                <div class="font-semibold text-xl">Float Label</div>
                <FloatLabel>
                    <InputText id="username" type="text" v-model="floatValue" />
                    <label for="username">Username</label>
                </FloatLabel>

                <div class="font-semibold text-xl">Textarea</div>
                <Textarea placeholder="Your Message" :autoResize="true" rows="3" cols="30" />

                <div class="font-semibold text-xl">AutoComplete</div>
                <AutoComplete v-model="selectedAutoValue" :suggestions="autoFilteredValue" optionLabel="name" placeholder="Search" dropdown multiple display="chip" @complete="searchCountry($event)" />

                <div class="font-semibold text-xl">DatePicker</div>
                <DatePicker :showIcon="true" :showButtonBar="true" v-model="calendarValue"></DatePicker>

                <div class="font-semibold text-xl">InputNumber</div>
                <InputNumber v-model="inputNumberValue" showButtons mode="decimal"></InputNumber>
            </div>

            <div class="card flex flex-col gap-4">
                <div class="font-semibold text-xl">Slider</div>
                <InputText v-model.number="sliderValue" />
                <Slider v-model="sliderValue" />

                <div class="flex flex-row mt-6">
                    <div class="flex flex-col gap-4 w-1/2">
                        <div class="font-semibold text-xl">Rating</div>
                        <Rating v-model="ratingValue" />
                    </div>
                    <div class="flex flex-col gap-4 w-1/2">
                        <div class="font-semibold text-xl">ColorPicker</div>
                        <ColorPicker style="width: 2rem" v-model="colorValue" />
                    </div>
                </div>

                <div class="font-semibold text-xl">Knob</div>
                <Knob v-model="knobValue" :step="10" :min="-50" :max="50" valueTemplate="{value}%" />
            </div>
        </div>
        <div class="md:w-1/2">
            <div class="card flex flex-col gap-4">
                <div class="font-semibold text-xl">RadioButton</div>
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="flex items-center">
                        <RadioButton id="option1" name="option" value="Chicago" v-model="radioValue" />
                        <label for="option1" class="leading-none ml-2">Chicago</label>
                    </div>
                    <div class="flex items-center">
                        <RadioButton id="option2" name="option" value="Los Angeles" v-model="radioValue" />
                        <label for="option2" class="leading-none ml-2">Los Angeles</label>
                    </div>
                    <div class="flex items-center">
                        <RadioButton id="option3" name="option" value="New York" v-model="radioValue" />
                        <label for="option3" class="leading-none ml-2">New York</label>
                    </div>
                </div>

                <div class="font-semibold text-xl">Checkbox</div>
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="flex items-center">
                        <Checkbox id="checkOption1" name="option" value="Chicago" v-model="checkboxValue" />
                        <label for="checkOption1" class="ml-2">Chicago</label>
                    </div>
                    <div class="flex items-center">
                        <Checkbox id="checkOption2" name="option" value="Los Angeles" v-model="checkboxValue" />
                        <label for="checkOption2" class="ml-2">Los Angeles</label>
                    </div>
                    <div class="flex items-center">
                        <Checkbox id="checkOption3" name="option" value="New York" v-model="checkboxValue" />
                        <label for="checkOption3" class="ml-2">New York</label>
                    </div>
                </div>

                <div class="font-semibold text-xl">ToggleSwitch</div>
                <ToggleSwitch v-model="switchValue" />
            </div>

            <div class="card flex flex-col gap-4">
                <div class="font-semibold text-xl">Listbox</div>
                <Listbox v-model="listboxValue" :options="listboxValues" optionLabel="name" :filter="true" />

                <div class="font-semibold text-xl">Select</div>
                <Select v-model="dropdownValue" :options="dropdownValues" optionLabel="name" placeholder="Select" />

                <div class="font-semibold text-xl">MultiSelect</div>
                <MultiSelect v-model="multiselectValue" :options="multiselectValues" optionLabel="name" placeholder="Select Countries" :filter="true">
                    <template #value="slotProps">
                        <div class="inline-flex items-center py-1 px-2 bg-primary text-primary-contrast rounded-border mr-2" v-for="option of slotProps.value" :key="option.code">
                            <span :class="'mr-2 flag flag-' + option.code.toLowerCase()" style="width: 18px; height: 12px" />
                            <div>{{ option.name }}</div>
                        </div>
                        <template v-if="!slotProps.value || slotProps.value.length === 0">
                            <div class="p-1">Select Countries</div>
                        </template>
                    </template>
                    <template #option="slotProps">
                        <div class="flex items-center">
                            <span :class="'mr-2 flag flag-' + slotProps.option.code.toLowerCase()" style="width: 18px; height: 12px" />
                            <div>{{ slotProps.option.name }}</div>
                        </div>
                    </template>
                </MultiSelect>

                <div class="font-semibold text-xl">TreeSelect</div>
                <TreeSelect v-model="selectedNode" :options="treeSelectNodes" placeholder="Select Item"></TreeSelect>
            </div>

            <div class="card flex flex-col gap-4">
                <div class="font-semibold text-xl">ToggleButton</div>
                <ToggleButton v-model="toggleValue" onLabel="Yes" offLabel="No" :style="{ width: '10em' }" />

                <div class="font-semibold text-xl">SelectButton</div>
                <SelectButton v-model="selectButtonValue" :options="selectButtonValues" optionLabel="name" />
            </div>
        </div>
    </Fluid>

    <Fluid class="flex mt-8">
        <div class="card flex flex-col gap-4 w-full">
            <div class="font-semibold text-xl">InputGroup</div>
            <div class="flex flex-col md:flex-row gap-4">
                <InputGroup>
                    <InputGroupAddon>
                        <i class="pi pi-user"></i>
                    </InputGroupAddon>
                    <InputText placeholder="Username" />
                </InputGroup>
                <InputGroup>
                    <InputGroupAddon>
                        <i class="pi pi-clock"></i>
                    </InputGroupAddon>
                    <InputGroupAddon>
                        <i class="pi pi-star-fill"></i>
                    </InputGroupAddon>
                    <InputNumber placeholder="Price" />
                    <InputGroupAddon>$</InputGroupAddon>
                    <InputGroupAddon>.00</InputGroupAddon>
                </InputGroup>
            </div>
            <div class="flex flex-col md:flex-row gap-4">
                <InputGroup>
                    <Button label="Search" />
                    <InputText placeholder="Keyword" />
                </InputGroup>
                <InputGroup>
                    <InputGroupAddon>
                        <Checkbox v-model="inputGroupValue" :binary="true" />
                    </InputGroupAddon>
                    <InputText placeholder="Confirm" />
                </InputGroup>
            </div>
        </div>
    </Fluid> -->





</template>

<script>
import proceso from './js/proceso.js';
export default {
    name: 'Perfiles',
    // components: {AppFooter, cargando},
    setup(){
      return{
        ...proceso()
      }
    }
}
</script>

<style scoped>
    @import './css/estilo.css';
</style>