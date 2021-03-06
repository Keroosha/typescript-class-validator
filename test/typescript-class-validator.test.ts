import { IsEmail } from 'class-validator';
import {
  Validate,
  Validator,
  ValidatorError
} from '../src/typescript-class-validator';
import { getNestedObjectProperty, getValidationErrors } from '../src/lib';

class BodyDto {
  @IsEmail()
  name: string;
}

describe('Validate param tests', () => {
  it('should selected nested property', () => {
    const data = {
      body: {
        item: {
          name: 'Danny'
        }
      }
    };

    const response = getNestedObjectProperty(data, 'body.item.name');
    expect(response).toEqual('Danny');
  });

  it('should return undefined property on non existent path', () => {
    const data = {};

    const response = getNestedObjectProperty(data, 'body.item.name');
    expect(response).toBeUndefined();
  });

  it('should return item on first level', () => {
    const data = {
      body: {
        name: 'Danny'
      }
    };

    const response = getNestedObjectProperty(data, 'body');
    expect(response.name).toEqual('Danny');
  });

  it('should return validation errors', () => {
    const response = getValidationErrors(BodyDto, {
      name: 'sds'
    });

    expect(response.length).toEqual(1);
    const { target, property, constraints } = response[0];
    expect(target).toEqual({ name: 'sds' });
    expect(property).toEqual('name');
    expect(constraints.isEmail).toEqual('name must be an email');
  });

  it('should not return validation errors', () => {
    const response = getValidationErrors(BodyDto, {
      name: 'sds@dasdas.com'
    });

    expect(response.length).toEqual(0);
  });

  it('should validate inferred ts type and throw', () => {
    class TestClass {
      @Validate()
      method(@Validator() body: BodyDto) {
        return 123;
      }
    }

    const instance = new TestClass();

    try {
      instance.method({
        name: 'asdas'
      });
    } catch (e) {
      expect(e.message).toBe('Validation Error');
      expect(e.validationErrors.length).toEqual(1);
      expect(e.validationErrors[0].constraints.isEmail).toEqual(
        'name must be an email'
      );
    }
  });

  it('should validate specific validator type and key and fail', () => {
    class TestClass {
      @Validate()
      public method(@Validator(BodyDto, 'body') body: any) {
        return 123;
      }
    }

    const instance = new TestClass();

    try {
      const response = instance.method({
        name: 'asdas'
      });
    } catch (e) {
      expect(e.message).toBe('Validation Error');
      expect(e.validationErrors.length).toEqual(1);
      expect(e.validationErrors[0].constraints.isDefined).toEqual(
        'property body is missing'
      );
    }
  });

  it('should validate specific validator type and key and succeed', () => {
    class TestClass {
      @Validate()
      method(
        @Validator(BodyDto, 'body')
        req: any
      ) {
        return 123;
      }
    }

    const instance = new TestClass();

    try {
      const response = instance.method({
        body: {
          name: 'asdas@gmail.com'
        }
      });
    } catch (e) {
      expect(e.message).toBe('Validation Error');
      expect(e.validationErrors.length).toEqual(1);
    }
  });

  it('should validate array types', () => {
    class TestClass {
      @Validate()
      method(@Validator(BodyDto) body: BodyDto[]) {
        return 123;
      }
    }

    const instance = new TestClass();

    try {
      const response = instance.method([
        {
          name: 'asdas@gmail.com'
        }
      ]);
    } catch (e) {
      expect(e.message).toBe('Validation Error');
      expect(e.validationErrors.length).toEqual(1);
    }

    try {
      instance.method([
        {
          name: 'asdasm'
        }
      ]);
    } catch (e) {
      expect(e.message).toBe('Validation Error');
      expect(e.validationErrors.length).toEqual(1);
      expect(e.validationErrors[0].constraints.isEmail).toEqual(
        'name must be an email'
      );
    }

    try {
      instance.method({
        name: 'asdasm'
      } as any);
    } catch (e) {
      expect(e.message).toBe('Validation Error');
      expect(e.validationErrors.length).toEqual(1);
      expect(e.validationErrors[0].constraints.isArray).toEqual(
        'input param must be array'
      );
    }
  });
});
