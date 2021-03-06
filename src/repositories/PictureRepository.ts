import { DeepPartial, EntityRepository, Repository } from "typeorm";
import { QueryPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { Picture } from "../entities/Picture";
import { GetPagnation } from "../models/PageQuery";
import { PictureInsertInput, PictureSaleInput, PictureUpdateInput, PictureVectorInput, ViewBycategoryQuery } from "../models/PictureInput";
import { GetMyListQuery } from "../models/PictureQuery";

@EntityRepository(Picture)
export class PictureRepository extends Repository<Picture> {
   
    // 사진 등록하기
    async insertWithOptions(newValue: PictureInsertInput){
        return await this.insert(newValue);
    }

    // picture_vector, picture_norm 저장하기
    async insertVector(token_id: string, newValue: PictureVectorInput){
        const { picture_vector, picture_norm} = newValue;

        const picture: DeepPartial<Picture> = {
            token_id,
            picture_vector,
            picture_norm
        };

        return await this.save(picture, { transaction: false, reload: false })
    }

    // 사진 업데이트하기
    async saveWithOptions(newValue: PictureUpdateInput){
        return await this.save(newValue,{ transaction: false, reload: false });
    }

    // 판매 토큰으로 등록하기
    async registerSale( newValue: PictureSaleInput){
       
        const { token_id, picture_price } = newValue;

        const picture: DeepPartial<Picture> = {
            token_id,
            picture_price,
            picture_state: "Y"
        };

        return await this.save(picture, { transaction: false, reload: false })
    }

    // 판매 취소(보유 중인 상태로 변경)
    async cancleSale(token_id: string){
        const picture: DeepPartial<Picture> = {
            token_id,
            picture_state: "N"
        };

        return await this.save(picture, { transaction: false, reload: false })
    }

     // 키워드별 사진 검색하기
     async getListByKeywords(keyword: string, query: GetPagnation) {
        const alias = "picture"
        
        const { first, last } = query;
        
        const qb = this.createQueryBuilder(alias)
           // .select([`${alias}.picture_url`, `${alias}.picture_title`])
            .where(`${alias}.picture_title LIKE :keyword`)
            .orWhere(`${alias}.picture_info LIKE :keyword`)
            .orWhere(`${alias}.picture_category LIKE :keyword`)
            .andWhere(`${alias}.picture_state=  "Y"`)
            .setParameters({
                keyword: `%${keyword}%`
            })
            .skip(first)
            .take(last)

        return await qb.getManyAndCount();
    }

    // 보유 토큰 확인하기 
    async getMyList(user_num: number, query: GetMyListQuery){   
       
        const alias = "picture"

        const { state, first, last } = query;

        const qb = this.createQueryBuilder(alias)
            .where(`${alias}.user_num = :user_num`)
            .andWhere(`${alias}.picture_state = :state`)
            .setParameters({
                user_num,
                state
            }) 
            .skip(first)
            .take(last)

        return await qb.getManyAndCount();
    }
    
    // 가격순으로 사진 보기
    async viewByPrice(query: GetPagnation) {

        const alias = "picture"
        
        const { first, last } = query;
        
        const qb = this.createQueryBuilder(alias)
            //.select([`${alias}.picture_url`, `${alias}.picture_title`])
            .orderBy(`${alias}.picture_price`, "DESC") // 높은 가격 순, 낮은 가격 순 나누기 
            .where(`${alias}.picture_state=  "Y"`)
            .skip(first)
            .take(last)

        return await qb.getManyAndCount();
    }

     // 카테고리 별로 사진 보기
     async viewByCategory(query: ViewBycategoryQuery) {
        const alias = "picture"
        
        const { category, first, last } = query;

        const qb = this.createQueryBuilder(alias)
            //.select([`${alias}.picture_url`, `${alias}.picture_title`])
            .where(`${alias}.picture_category= :category`)
            .setParameters( { category } )
            .andWhere(`${alias}.picture_state=  "Y"`)
            .skip(first)
            .take(last)
            
        return await qb.getManyAndCount();
    }

    // 인기순으로 사진보기
    async viewByPopularity(query: GetPagnation) {
        const alias = "picture"

        const { first, last } = query;

        const qb = this.createQueryBuilder(alias)
           // .select([`${alias}.picture_url`, `${alias}.picture_title`])
            .orderBy(`${alias}.picture_count`, "DESC")
            .andWhere(`${alias}.picture_state=  "Y"`)
            .skip(first)
            .take(last)
            
        return await qb.getManyAndCount();
    }

    //사진 상세 정보 보기 
    async viewPicture(token_id: string){

        const alias = "picture" 

        const qb = this.createQueryBuilder(alias) 
            .where(`${alias}.token_id = :token_id`)
            .setParameters({
                token_id
            }) 

        return await qb.getOne();
    }

    // 조회수 증가 
    async updateCount(token_id: string){

        /* QueryDeepPartial<Type> 예제 */
        const picture: QueryPartialEntity<Picture> = {};
        picture.picture_count = () => "`picture_count` + 1";
        // picture.createdAt = () => "now()";

        const qb = this.createQueryBuilder()
            .update(Picture)
            .set(picture)
            .where("token_id = :token_id")
            .setParameters({
                token_id
            });
        

        return await qb.execute();
    }

    async getUserId(token_id: string){   

        const qb = this.createQueryBuilder("picture")
            .leftJoinAndSelect("picture.user", "user")
            .select(["user.user_account",
                "picture.token_id"
            ])
            .where(`picture.token_id= :token_id`)
            .setParameters({
                token_id
            })

        return await qb.getMany();
    }

}